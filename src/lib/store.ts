import { signal } from '@preact/signals';
import { Genre, Language, RadioStation } from '~/components/types';
import { Podcast } from './db';

export const headerTitle = signal<string>('');
export const followedPodcasts = signal<Podcast[]>([]);
export const recentlyVisitedPodcasts = signal<Podcast[]>([]);
export const radioStations = signal<RadioStation[]>([]);
export const radioLanguages = signal<Language[]>([]);
export const radioGenres = signal<Genre[]>([]);
export const followedRadioStationIDs = signal<string[]>([]);
export const recentlyVisitedRadioStationIDs = signal<string[]>([]);

export const getPodcast = (id: string): Podcast | undefined => {
  return [...followedPodcasts.value, ...recentlyVisitedPodcasts.value].find((p) => p.id === id);
};

export const getRadioStation = (id: string): RadioStation | undefined => {
  return radioStations.value.find((r) => r.id === id);
};

export const getRecentlyVisitedRadioStations = (): RadioStation[] => {
  const stations = recentlyVisitedRadioStationIDs.value.map((id) => getRadioStation(id)).filter((r) => !!r);
  return [...stations, ...radioStations.value.filter((rs) => !stations.some((s) => s.id === rs.id))].slice(
    0,
    10,
  ) as RadioStation[];
};

export const updatePodcast = (updatedPodcast: Podcast) => {
  followedPodcasts.value = followedPodcasts.value.map((p) => (p.id === updatedPodcast.id ? updatedPodcast : p));
  recentlyVisitedPodcasts.value = recentlyVisitedPodcasts.value.map((p) =>
    p.id === updatedPodcast.id ? updatedPodcast : p,
  );
};

export const addRecentlyVisitedPodcast = (podcast: Podcast) => {
  recentlyVisitedPodcasts.value = [podcast, ...recentlyVisitedPodcasts.value.filter((p) => p.id !== podcast.id)].slice(
    0,
    10,
  );
};

export const addRecentlyVisitedRadioStation = (id: string | undefined) => {
  if (!id) return;
  recentlyVisitedRadioStationIDs.value = [id, ...recentlyVisitedRadioStationIDs.value.filter((s) => s !== id)].slice(
    0,
    10,
  );
};

export const followRadioStation = (id: string) => {
  if (!followedRadioStationIDs.value.some((s) => s === id)) {
    followedRadioStationIDs.value = [...followedRadioStationIDs.value, id];
  } else {
    unfollowRadioStation(id);
  }
};

export const unfollowRadioStation = (id: string) => {
  followedRadioStationIDs.value = followedRadioStationIDs.value.filter((s) => s !== id);
};

export const isFollowedRadioStation = (id: string) => {
  return followedRadioStationIDs.value.some((s) => s === id);
};

export const followPodcast = (podcast: Podcast) => {
  if (!followedPodcasts.value.some((p) => p.id === podcast.id)) {
    followedPodcasts.value = [...followedPodcasts.value, podcast];
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
