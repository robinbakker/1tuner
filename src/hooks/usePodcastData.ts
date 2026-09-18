import { XMLParser } from 'fast-xml-parser';
import { useCallback, useLayoutEffect, useRef, useState } from 'preact/hooks';
import { fetchPodcastFeed } from '~/lib/podcastFeed';
import { getTimeStringFromSeconds } from '~/lib/utils';
import { getPodcast } from '~/store/signals/podcast';
import { Podcast } from '~/store/types';

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
  const [error, setError] = useState<string | null>(null);
  const requestRef = useRef<AbortController | null>(null);
  const disposedRef = useRef(false);
  const cancelFetch = useCallback(() => {
    requestRef.current?.abort();
    requestRef.current = null;
  }, []);
  useLayoutEffect(() => {
    disposedRef.current = false;
    return () => {
      disposedRef.current = true;
      cancelFetch();
    };
  }, [cancelFetch]);

  const getDurationString = useCallback((duration: string) => {
    if (!/^\d+(?:\.\d+)?$|^\d+:\d{2}(?::\d{2})?$/.test(duration)) return '';
    const durationParts = duration.split(':');
    if (durationParts.length >= 2) {
      return `${durationParts[0]}:${durationParts[1]}`;
    }
    return getTimeStringFromSeconds(+duration);
  }, []);

  const fetchPodcastData = useCallback(
    async (id: string, feedUrl: string, skipCache = false) => {
      cancelFetch();
      if (disposedRef.current) return null;
      setError(null);
      setIsLoading(false);
      if (!id || !feedUrl) return null;
      const controller = new AbortController();
      requestRef.current = controller;

      let podcastData = getPodcast(id);
      setIsLoading(true);

      try {
        if (!podcastData || skipCache || Date.now() - podcastData.lastFetched > 24 * 60 * 60 * 1000) {
          const xmlData = await fetchPodcastFeed(feedUrl, controller.signal);
          controller.signal.throwIfAborted();

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
          // Playback may have updated the saved record while the requestRef was pending.
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
        if (!controller.signal.aborted) {
          setError(error instanceof Error ? error.message : 'Failed to load podcast feed.');
        }
        return null;
      } finally {
        if (requestRef.current === controller) {
          requestRef.current = null;
          setIsLoading(false);
        }
      }
    },
    [getDurationString, cancelFetch],
  );

  return {
    isLoading,
    error,
    cancelFetch,
    fetchPodcastData,
  };
};
