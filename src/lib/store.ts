import { signal } from '@preact/signals';
import { Podcast } from './db';

export const headerTitle = signal<string>('');
export const followedPodcasts = signal<Podcast[]>([]);
export const recentlyVisitedPodcasts = signal<Podcast[]>([]);

export function getPodcast(id: string): Podcast | undefined {
  return [...followedPodcasts.value, ...recentlyVisitedPodcasts.value].find((p) => p.id === id);
}

export function updatePodcast(updatedPodcast: Podcast) {
  followedPodcasts.value = followedPodcasts.value.map((p) => (p.id === updatedPodcast.id ? updatedPodcast : p));
  recentlyVisitedPodcasts.value = recentlyVisitedPodcasts.value.map((p) => (p.id === updatedPodcast.id ? updatedPodcast : p));
}

export function addToRecentlyVisited(podcast: Podcast) {
  recentlyVisitedPodcasts.value = [podcast, ...recentlyVisitedPodcasts.value.filter((p) => p.id !== podcast.id)].slice(0, 10);
}

export function followPodcast(podcast: Podcast) {
  if (!followedPodcasts.value.some((p) => p.id === podcast.id)) {
    followedPodcasts.value = [...followedPodcasts.value, podcast];
  } else {
    unfollowPodcast(podcast.id);
  }
}

export const unfollowPodcast = (id: string) => {
  followedPodcasts.value = followedPodcasts.value.filter((p) => p.id !== id);
};

export const isFollowedPodcast = (id: string) => {
  return followedPodcasts.value.some((p) => p.id === id);
};
