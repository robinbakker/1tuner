import { XMLParser } from 'fast-xml-parser';
import { useCallback, useState } from 'preact/hooks';
import { delay, getTimeStringFromSeconds } from '~/lib/utils';
import { getPodcast } from '~/store/signals/podcast';
import { Podcast } from '~/store/types';

const FETCH_TIMEOUT = 10000; // 10 seconds
const MAX_RETRIES = 2;
const VALID_CONTENT_TYPES = [
  'application/rss+xml',
  'application/xml',
  'text/xml',
  'application/rdf+xml',
  'application/text',
  'text/plain',
  'text/plain;charset=utf-8',
];

const isValidPodcastFeed = (xmlData: string): boolean => {
  const hasRssTag = /<rss[^>]*>/i.test(xmlData);
  const hasChannelTag = /<channel[^>]*>/i.test(xmlData);
  const hasItemTag = /<item[^>]*>/i.test(xmlData);
  const hasEnclosureTag = /<enclosure[^>]*>/i.test(xmlData);

  return hasRssTag && hasChannelTag && hasItemTag && hasEnclosureTag;
};

export const usePodcastData = () => {
  const [isLoading, setIsLoading] = useState(false);

  const getDurationString = useCallback((duration: string) => {
    const durationParts = duration.split(':');
    if (durationParts.length >= 2) {
      return `${durationParts[0]}:${durationParts[1]}`;
    }
    return getTimeStringFromSeconds(+duration);
  }, []);

  const fetchWithTimeout = useCallback(async (url: string, options: RequestInit = {}) => {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), FETCH_TIMEOUT);

    try {
      const response = await fetch(url, {
        ...options,
        signal: controller.signal,
      });
      clearTimeout(timeoutId);
      return response;
    } catch (error) {
      clearTimeout(timeoutId);
      throw error;
    }
  }, []);

  const getResponseText = useCallback(async (response: Response) => {
    if (!response.ok) throw new Error('Network response failed');

    // Validate content type
    const contentType = response.headers.get('content-type')?.toLowerCase() || '';
    const isValidContentType = VALID_CONTENT_TYPES.some((type) => contentType.includes(type));

    if (!isValidContentType) {
      throw new Error('Invalid content type: Not a valid RSS feed');
    }

    const xmlData = await response.text();

    if (!isValidPodcastFeed(xmlData)) {
      throw new Error('Invalid feed: Not a podcast RSS feed');
    }

    return xmlData;
  }, []);

  const fetchFeed = useCallback(
    async (feedUrl: string, retryCount = 0): Promise<string> => {
      // Try direct fetch first
      try {
        const response = await fetchWithTimeout(feedUrl);
        return await getResponseText(response);
      } catch {
        // If direct fetch fails, try proxy
        try {
          const proxyResponse = await fetchWithTimeout('https://request.tuner.workers.dev', {
            method: 'POST',
            body: feedUrl,
          });
          return await getResponseText(proxyResponse);
        } catch (proxyError) {
          // If we haven't reached max retries, try again after a delay
          if (retryCount < MAX_RETRIES) {
            await delay(1000 * (retryCount + 1)); // Exponential backoff
            return fetchFeed(feedUrl, retryCount + 1);
          }
          throw new Error(
            `Failed to fetch feed after ${MAX_RETRIES} retries: ${
              proxyError instanceof Error ? proxyError.message : 'Unknown error'
            }`,
          );
        }
      }
    },
    [fetchWithTimeout, getResponseText],
  );

  const fetchPodcastData = useCallback(
    async (id: string, feedUrl: string, skipCache = false) => {
      if (!id || !feedUrl) return null;

      let podcastData = getPodcast(id);
      setIsLoading(true);

      try {
        if (!podcastData || skipCache || Date.now() - podcastData.lastFetched > 24 * 60 * 60 * 1000) {
          const xmlData = await fetchFeed(feedUrl);

          const parser = new XMLParser({
            ignoreAttributes: false,
            attributeNamePrefix: '@_',
          });
          const result = parser.parse(xmlData);

          if (!result.rss || !result.rss.channel) {
            throw new Error('Invalid podcast RSS feed structure');
          }

          const channel = result.rss.channel;

          podcastData = {
            id,
            title: channel.title,
            description: channel.description,
            imageUrl: channel.image?.url || channel['itunes:image']?.['@_href'] || '',
            url: feedUrl,
            feedUrl: feedUrl,
            categories: channel.categories,
            addedDate: podcastData?.addedDate || Date.now(),
            lastFetched: Date.now(),
            episodes: (channel.item || [])
              .slice(0, 50)
              .map(
                (item: {
                  title: string;
                  description: string;
                  guid?: { '#text': string };
                  pubDate: string;
                  enclosure?: { '@_url': string; '@_type': string };
                  'itunes:duration'?: string;
                  duration?: string;
                }) => ({
                  title: item.title,
                  description: item.description,
                  guid: item.guid?.['#text'],
                  pubDate: new Date(item.pubDate),
                  audio: item.enclosure?.['@_url'],
                  mimeType: item.enclosure?.['@_type'],
                  duration: getDurationString(`${item['itunes:duration'] ?? item['duration']}`),
                  currentTime:
                    podcastData?.episodes?.find((ep) => ep.audio === item.enclosure?.['@_url'])?.currentTime || 0,
                }),
              ),
          } as Podcast;
        }
        return podcastData;
      } catch (error) {
        console.error('Error fetching podcast:', error);
        return null;
      } finally {
        setIsLoading(false);
      }
    },
    [getDurationString, fetchFeed],
  );

  return {
    isLoading,
    fetchPodcastData,
  };
};
