import { XMLParser } from 'fast-xml-parser';
import { useRoute } from 'preact-iso';
import { useCallback, useEffect, useMemo, useState } from 'preact/hooks';
import { getTimeStringFromSeconds, normalizedUrlWithoutScheme } from '~/lib/utils';
import { playerState } from '~/store/signals/player';
import {
  addRecentlyVisitedPodcast,
  followPodcast,
  getPodcast,
  isFollowedPodcast,
  unfollowPodcast,
  updatePodcast,
} from '~/store/signals/podcast';
import { uiState } from '~/store/signals/ui';
import { Episode, Podcast } from '~/store/types';

export const usePodcast = () => {
  const { params } = useRoute();
  const [isLoading, setIsLoading] = useState(true);
  const [isFollowing, setIsFollowing] = useState(false);
  const [podcast, setPodcast] = useState<Podcast | null>(null);

  const paramsFeedUrl = useMemo(() => {
    return `https://${normalizedUrlWithoutScheme(atob(params.id))}`;
  }, [params.id]);

  const getDurationString = useCallback((duration: string) => {
    const durationParts = duration.split(':');
    if (durationParts.length >= 2) {
      return `${durationParts[0]}:${durationParts[1]}`;
    }
    return getTimeStringFromSeconds(+duration);
  }, []);

  useEffect(() => {
    const fetchPodcastData = async () => {
      if (!params.id) return;

      setIsLoading(true);
      let podcastData = getPodcast(params.id);

      if (!podcastData || Date.now() - podcastData.lastFetched > 24 * 60 * 60 * 1000) {
        try {
          let response: Response;
          let xmlData: string;

          try {
            response = await fetch(paramsFeedUrl);
            xmlData = await response.text();
          } catch {
            // If direct fetch fails, try proxy
            const proxyResponse = await fetch('https://request.tuner.workers.dev', {
              method: 'POST',
              body: paramsFeedUrl,
            });

            if (!proxyResponse.ok) {
              throw new Error('Failed to fetch podcast via proxy');
            }

            xmlData = await proxyResponse.text();
          }
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
            id: params.id,
            title: channel.title,
            description: channel.description,
            imageUrl: channel.image?.url || '',
            url: paramsFeedUrl,
            feedUrl: paramsFeedUrl,
            categories: channel.categories,
            addedDate: podcastData?.addedDate || Date.now(),
            lastFetched: Date.now(),
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            episodes: (channel.item || []).slice(0, 50).map((item: any) => ({
              title: item.title,
              description: item.description,
              pubDate: new Date(item.pubDate),
              audio: item.enclosure?.['@_url'],
              mimeType: item.enclosure?.['@_type'],
              duration: getDurationString(`${item['itunes:duration'] ?? item['duration']}`),
            })),
          } as Podcast;

          updatePodcast(podcastData);
        } catch (error) {
          console.error('Error fetching podcast:', error);
          setIsLoading(false);
          return;
        }
      }

      uiState.value = { ...uiState.value, headerTitle: podcastData.title };

      addRecentlyVisitedPodcast(podcastData);
      setPodcast(podcastData);

      if (isFollowedPodcast(params.id)) {
        setIsFollowing(true);
      }

      setIsLoading(false);
    };

    if (typeof window !== 'undefined') {
      fetchPodcastData();
    } else if ((global as any).__PRERENDER_PODCASTS__) {
      const podcastData = (global as any).__PRERENDER_PODCASTS__.find((p: Podcast) => p.id === params.id);
      console.log('Found podcast data in global:', podcastData);

      setPodcast(podcastData);
    }

    return () => {
      uiState.value = { ...uiState.value, headerTitle: '' };
    };
  }, [params.id]);

  const toggleFollow = () => {
    if (!podcast) return;

    if (isFollowing) {
      unfollowPodcast(params.id);
    } else {
      followPodcast(podcast);
    }
    setIsFollowing(!isFollowing);
  };

  const handleEpisodeClick = useCallback(
    (episode: Episode) => {
      if (!podcast) return;
      playerState.value = {
        isPlaying: true,
        contentID: params.id,
        title: episode.title,
        description: podcast.title,
        imageUrl: podcast.imageUrl,
        streams: [{ mimetype: episode.mimeType || 'audio/mpeg', url: episode.audio }],
        pageLocation: `/podcast/${params.name}/${params.id}`,
        currentTime: episode.currentTime || 0,
      };
    },
    [podcast, params.id, params.name],
  );

  return {
    params,
    isLoading,
    podcast,
    isFollowing,
    toggleFollow,
    handleEpisodeClick,
  };
};