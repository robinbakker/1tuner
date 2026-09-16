import { computed, signal } from '@preact/signals';
import { Podcast, PodcastSearchResult } from '../types';

export const followedPodcasts = signal<Podcast[]>([]);
export const recentlyVisitedPodcasts = signal<Podcast[]>([]);
export const lastPodcastSearchResult = signal<PodcastSearchResult | null>(null);
export const featuredPodcasts = signal<Podcast[]>([]);

export const savedPodcasts = computed(() => {
  return [...followedPodcasts.value, ...recentlyVisitedPodcasts.value];
});

export const getPodcast = (id: string): Podcast | undefined => {
  return savedPodcasts.value.find((p) => p.id === id);
};

export const updatePodcast = (updatedPodcast: Podcast) => {
  followedPodcasts.value = followedPodcasts.value.map((p) => (p.id === updatedPodcast.id ? updatedPodcast : p));
  recentlyVisitedPodcasts.value = recentlyVisitedPodcasts.value.map((p) =>
    p.id === updatedPodcast.id ? updatedPodcast : p,
  );
};

export const updatePodcastEpisodeCurrentTime = (podcastID: string, episodeAudioUrl: string, currentTime: number) => {
  const podcast = getPodcast(podcastID);
  if (!podcast || !episodeAudioUrl) return;
  const target = podcast.episodes?.find((episode) => episode.audio.replace(/&amp;/g, '&') === episodeAudioUrl);
  if (!target || target.currentTime === currentTime) return;
  updatePodcast({
    ...podcast,
    episodes: podcast.episodes?.map((episode) => {
      if (episode.audio.replace(/&amp;/g, '&') === episodeAudioUrl && episode.currentTime !== currentTime) {
        return { ...episode, currentTime: currentTime };
      }
      return episode;
    }),
  });
};

export const addRecentlyVisitedPodcast = (podcast: Podcast) => {
  recentlyVisitedPodcasts.value = [podcast, ...recentlyVisitedPodcasts.value.filter((p) => p.id !== podcast.id)].slice(
    0,
    10,
  );
};

export const addFollowedPodcast = (podcast: Podcast): boolean => {
  if (followedPodcasts.value.some((p) => p.id === podcast.id)) return false;
  followedPodcasts.value = [...followedPodcasts.value, podcast];
  return true;
};

export const followPodcast = (podcast: Podcast) => {
  if (!followedPodcasts.value.some((p) => p.id === podcast.id)) {
    addFollowedPodcast(podcast);
  } else {
    unfollowPodcast(podcast.id);
  }
};

export const unfollowPodcast = (id: string) => {
  followedPodcasts.value = followedPodcasts.value.filter((p) => p.id !== id);
};

export const isFollowedPodcast = (id: string) => {
  return followedPodcasts.value.some((p) => p.id === id);
};

export const setLastPodcastSearchResult = (query: string, result: Podcast[]) => {
  lastPodcastSearchResult.value = { query, result };
};

export const clearLastPodcastSearchResult = () => {
  lastPodcastSearchResult.value = null;
};
