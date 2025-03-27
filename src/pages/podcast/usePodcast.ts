import { useRoute } from 'preact-iso';
import { useCallback, useEffect, useMemo, useState } from 'preact/hooks';
import { useHead } from '~/hooks/useHead';
import { usePodcastData } from '~/hooks/usePodcastData';
import { getPodcastUrlID, normalizedUrlWithoutScheme, slugify, stripHtml } from '~/lib/utils';
import { isDBLoaded } from '~/store/db/db';
import { playerState } from '~/store/signals/player';
import { addRecentlyVisitedPodcast, followPodcast, isFollowedPodcast, unfollowPodcast } from '~/store/signals/podcast';
import { uiState } from '~/store/signals/ui';
import { Episode, Podcast } from '~/store/types';

export const usePodcast = () => {
  const { params } = useRoute();
  // const [isLoading, setIsLoading] = useState(typeof window !== 'undefined');
  const [isFollowing, setIsFollowing] = useState(false);
  const [podcast, setPodcast] = useState<Podcast | null>(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (globalThis as any)?.__PRERENDER_PODCASTS__?.find((p: Podcast) => p.id === params.id),
  );
  const { fetchPodcastData, isLoading } = usePodcastData();

  useHead({
    title: podcast ? podcast.title : 'Podcast',
    description: podcast ? stripHtml(podcast.description).slice(0, 200) : undefined,
    image: podcast?.imageUrl,
    url: podcast
      ? `${import.meta.env.VITE_BASE_URL}/podcast/${slugify(podcast.title)}/${getPodcastUrlID(podcast.url)}`
      : undefined,
    type: 'music.playlist',
  });

  const paramsFeedUrl = useMemo(() => {
    return params.id ? `https://${normalizedUrlWithoutScheme(atob(params.id))}` : '';
  }, [params.id]);

  const lastPlayedEpisode = useMemo(() => {
    return podcast?.episodes?.find((e) => e.currentTime && e.currentTime > 0);
  }, [podcast?.episodes]);

  const nowPlayingState = useMemo(() => {
    return playerState.value?.playType === 'podcast' && playerState.value.contentID === params.id
      ? playerState.value
      : null;
  }, [playerState.value, params.id]);

  const getPodcastData = useCallback(
    async (skipCache = false) => {
      if (!params.id || !isDBLoaded.value) return;

      const podcastData = await fetchPodcastData(params.id, paramsFeedUrl, skipCache);
      if (!podcastData) return;

      uiState.value = { ...uiState.value, headerTitle: podcastData.title };

      addRecentlyVisitedPodcast(podcastData);
      setPodcast(podcastData);

      if (isFollowedPodcast(params.id)) {
        setIsFollowing(true);
      }
    },
    [params.id, fetchPodcastData, paramsFeedUrl],
  );

  useEffect(() => {
    if (typeof window !== 'undefined') {
      getPodcastData();
    }

    return () => {
      uiState.value = { ...uiState.value, headerTitle: '' };
    };
  }, [getPodcastData]);

  useEffect(() => {
    if (nowPlayingState) {
      getPodcastData();
    }
  }, [getPodcastData, nowPlayingState]);

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
        playType: 'podcast',
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

  const handleFetchNewEpisodes = async () => {
    if (isLoading) return;
    getPodcastData(true);
  };

  return {
    params,
    isLoading,
    podcast,
    lastPlayedEpisode,
    isFollowing,
    nowPlayingState,
    toggleFollow,
    handleEpisodeClick,
    handleFetchNewEpisodes,
  };
};
