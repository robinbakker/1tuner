import { XMLParser } from 'fast-xml-parser';
import { useRoute } from 'preact-iso';
import { useEffect, useMemo, useState } from 'preact/hooks';
import { normalizedUrlWithoutScheme } from '~/lib/utils';
import {
  addRecentlyVisitedPodcast,
  followPodcast,
  getPodcast,
  isFollowedPodcast,
  unfollowPodcast,
  updatePodcast,
} from '~/store/signals/podcast';
import { headerTitle } from '~/store/signals/ui';
import { Podcast } from '~/store/types';

export const usePodcast = () => {
  const { params } = useRoute();
  const [isLoading, setIsLoading] = useState(true);
  const [isFollowing, setIsFollowing] = useState(false);
  const [podcast, setPodcast] = useState<Podcast | null>(null);

  const paramsFeedUrl = useMemo(() => {
    return `https://${normalizedUrlWithoutScheme(atob(params.id))}`;
  }, [params.id]);

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
              duration: item['itunes:duration'],
            })),
          } as Podcast;

          updatePodcast(podcastData);
        } catch (error) {
          console.error('Error fetching podcast:', error);
          setIsLoading(false);
          return;
        }
      }

      headerTitle.value = podcastData.title;

      addRecentlyVisitedPodcast(podcastData);
      setPodcast(podcastData);

      if (isFollowedPodcast(params.id)) {
        setIsFollowing(true);
      }

      setIsLoading(false);
    };

    fetchPodcastData();

    return () => {
      headerTitle.value = '';
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

  return {
    params,
    isLoading,
    podcast,
    isFollowing,
    toggleFollow,
  };
};
