import { useLocation, useRoute } from 'preact-iso';
import { useCallback, useEffect, useLayoutEffect, useMemo, useState } from 'preact/hooks';
import { useHead } from '~/hooks/useHead';
import { usePodcastData } from '~/hooks/usePodcastData';
import { getPodcastUrlID, normalizedUrlWithoutScheme, slugify, stripHtml } from '~/lib/utils';
import { isDBLoaded } from '~/store/db/db';
import { playerState } from '~/store/signals/player';
import {
  addRecentlyVisitedPodcast,
  followPodcast,
  getPodcast,
  isFollowedPodcast,
  unfollowPodcast,
} from '~/store/signals/podcast';
import { uiState } from '~/store/signals/ui';
import { Episode, Podcast } from '~/store/types';

export const usePodcast = () => {
  const { params, path: podcastPath } = useRoute();
  const { path, route } = useLocation();
  const isCurrentRoute = path === podcastPath;
  const [isFollowing, setIsFollowing] = useState(false);
  const [podcast, setPodcast] = useState<Podcast | null>(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (globalThis as any)?.__PRERENDER_PODCASTS__?.find((p: Podcast) => p.id === params.id),
  );
  const { fetchPodcastData, isLoading, error, cancelFetch } = usePodcastData();

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

  const selectedEpisodeID = useMemo(() => {
    if (!podcast?.episodes) return -1;
    const episodeID = params.episodeID ? decodeURIComponent(params.episodeID) : null;
    if (episodeID && podcast?.episodes?.some((ep) => ep.guid === episodeID)) {
      return episodeID;
    }
    return null;
  }, [params.episodeID, podcast?.episodes]);

  useEffect(() => {
    if (isCurrentRoute && isDBLoaded.value && params.episodeID && !selectedEpisodeID) {
      route(`/podcast/${params.name}/${params.id}`, true);
    }
  }, [isCurrentRoute, isDBLoaded.value, params.episodeID, params.id, params.name, route, selectedEpisodeID]);

  const getPodcastData = useCallback(
    async (skipCache = false) => {
      if (!isCurrentRoute || !params.id || !isDBLoaded.value) return;

      const podcastData = await fetchPodcastData(params.id, paramsFeedUrl, skipCache);
      if (!podcastData) return;

      const updatedPodcast = addRecentlyVisitedPodcast(podcastData);
      uiState.value = { ...uiState.value, headerTitle: updatedPodcast.title };
      setPodcast(updatedPodcast);

      if (isFollowedPodcast(params.id)) {
        setIsFollowing(true);
      }
    },
    [isCurrentRoute, params.id, fetchPodcastData, paramsFeedUrl, isDBLoaded.value],
  );

  useLayoutEffect(() => {
    // Lazy navigation can retain the old page while loading its replacement.
    // Changing route ownership runs the previous cleanup immediately.
    if (!isCurrentRoute) return;
    setPodcast(getPodcast(params.id) ?? null);
    setIsFollowing(isFollowedPodcast(params.id));
    getPodcastData();

    return () => {
      cancelFetch();
      uiState.value = { ...uiState.value, headerTitle: '' };
    };
  }, [isCurrentRoute, getPodcastData, cancelFetch, params.id]);

  useEffect(() => {
    if (nowPlayingState) {
      // Playback updates should not replace an in-flight episode refresh.
      const savedPodcast = getPodcast(params.id);
      if (savedPodcast) setPodcast(savedPodcast);
    }
  }, [params.id, nowPlayingState]);

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
        streams: [{ mimetype: episode.mimeType || 'audio/mpeg', url: episode.audio.replace(/&amp;/g, '&') }],
        pageLocation: `/podcast/${params.name}/${params.id}`,
        currentTime:
          getPodcast(params.id)?.episodes?.find((saved) => saved.audio === episode.audio)?.currentTime ??
          episode.currentTime ??
          0,
        shareUrl: `/podcast/${params.name}/${params.id}${episode.guid ? `/${encodeURIComponent(episode.guid)}` : ''}`,
      };
    },
    [podcast, params.id, params.name],
  );

  const handleFetchNewEpisodes = async () => {
    if (isLoading) return;
    getPodcastData(true);
  };

  const handleShowAllEpisodesClick = () => {
    route(`/podcast/${params.name}/${params.id}`);
  };

  return {
    params,
    isLoading,
    error,
    podcast,
    lastPlayedEpisode,
    isFollowing,
    nowPlayingState,
    selectedEpisodeID,
    toggleFollow,
    handleEpisodeClick,
    handleFetchNewEpisodes,
    handleShowAllEpisodesClick,
  };
};
