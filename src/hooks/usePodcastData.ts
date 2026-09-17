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
  const hasRssTag = /<rss\b[^>]*>/i.test(xmlData);
  const hasChannelTag = /<channel\b[^>]*>/i.test(xmlData);
  const hasItemTag = /<item\b[^>]*>/i.test(xmlData);
  const hasEnclosureTag = /<enclosure\b[^>]*>/i.test(xmlData);

  return hasRssTag && hasChannelTag && (!hasItemTag || hasEnclosureTag);
};

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

const getText = (value: unknown): string => {
  const text = isRecord(value) ? value['#text'] : value;
  return typeof text === 'string' ? text : '';
};

const decodeHtmlEntities = (value: unknown): string => {
  const textarea = document.createElement('textarea');
  textarea.innerHTML = getText(value);
  return textarea.value;
};

export const usePodcastData = () => {
  const [isLoading, setIsLoading] = useState(false);

  const getDurationString = useCallback((duration: string) => {
    if (!/^\d+(?:\.\d+)?$|^\d+:\d{2}(?::\d{2})?$/.test(duration)) return '';
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
            // IDs and other text must retain leading zeros and large numeric values.
            parseTagValue: false,
            processEntities: {
              enabled: false,
            },
          });
          const result: unknown = parser.parse(xmlData);

          if (!isRecord(result) || !isRecord(result.rss) || !isRecord(result.rss.channel)) {
            throw new Error('Invalid podcast RSS feed structure');
          }

          const channel = result.rss.channel;
          const items = channel.item === undefined ? [] : Array.isArray(channel.item) ? channel.item : [channel.item];
          const image = isRecord(channel.image) ? channel.image : undefined;
          const itunesImage = isRecord(channel['itunes:image']) ? channel['itunes:image'] : undefined;
          console.log('Parsed channel data:', channel);
          // Playback may have updated the saved record while the request was pending.
          const savedPodcast = getPodcast(id);
          podcastData = {
            id,
            title: decodeHtmlEntities(channel.title),
            description: decodeHtmlEntities(channel.description),
            imageUrl: decodeHtmlEntities(image?.url) || decodeHtmlEntities(itunesImage?.['@_href']),
            url: feedUrl,
            feedUrl: feedUrl,
            categories: Array.isArray(channel.categories)
              ? channel.categories.map(decodeHtmlEntities).filter(Boolean)
              : undefined,
            addedDate: savedPodcast?.addedDate ?? podcastData?.addedDate ?? Date.now(),
            lastFetched: Date.now(),
            episodes: items
              .filter(isRecord)
              .slice(0, 50)
              .map((item) => {
                const enclosure = isRecord(item.enclosure) ? item.enclosure : undefined;
                const audio = decodeHtmlEntities(enclosure?.['@_url']);
                const pubDate = new Date(getText(item.pubDate));
                return {
                  title: decodeHtmlEntities(item.title),
                  description: decodeHtmlEntities(item.description),
                  guid: decodeHtmlEntities(item.guid) || undefined,
                  pubDate: Number.isNaN(pubDate.getTime()) ? undefined : pubDate,
                  audio,
                  mimeType: getText(enclosure?.['@_type']),
                  duration: getDurationString(getText(item['itunes:duration']) || getText(item.duration)),
                  currentTime: savedPodcast?.episodes?.find((ep) => ep.audio === audio)?.currentTime ?? 0,
                };
              }),
          } satisfies Podcast;
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
