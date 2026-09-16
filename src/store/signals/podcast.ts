import { batch, computed, signal } from '@preact/signals';
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
  // Read progress at commit time: playback may have advanced while the feed was fetched.
  const saved = getPodcast(podcast.id);
  // A cached read can finish after a refresh; keep the newer feed metadata.
  const latest = saved && saved.lastFetched > podcast.lastFetched ? saved : podcast;
  const progress = new Map(saved?.episodes?.map((episode) => [episode.audio, episode.currentTime]));
  const updatedPodcast: Podcast = {
    ...latest,
    addedDate: saved?.addedDate ?? latest.addedDate,
    episodes: latest.episodes?.map((episode) => ({
      ...episode,
      currentTime: progress.get(episode.audio) ?? episode.currentTime,
    })),
  };

  batch(() => {
    followedPodcasts.value = followedPodcasts.value.map((p) => (p.id === podcast.id ? updatedPodcast : p));
    recentlyVisitedPodcasts.value = [
      updatedPodcast,
      ...recentlyVisitedPodcasts.value.filter((p) => p.id !== podcast.id),
    ].slice(0, 10);
  });
  return updatedPodcast;
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
