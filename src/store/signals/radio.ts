import { computed, signal } from '@preact/signals';
import { Genre, Language, Podcast, RadioSearchFilters, RadioSearchResult, RadioStation } from '~/store/types';
import { playerState } from './player';

export const radioStations = signal<RadioStation[]>([]);
export const radioSearchFilters = signal<RadioSearchFilters | null>(null);
export const radioLanguages = signal<Language[]>([]);
export const radioGenres = signal<Genre[]>([]);
export const followedRadioStationIDs = signal<string[]>([]);
export const recentlyVisitedRadioStationIDs = signal<string[]>([]);
export const lastRadioSearchResult = signal<RadioSearchResult | null>(null);
export const stationPodcasts = signal<Record<string, Podcast[]>>({});

export const userLanguage = computed(() => {
  const navLang = navigator.language;
  if (radioLanguages.value.some((lang) => lang.id === navLang)) return navLang;
  const lang = radioLanguages.value.find((lang) => navLang.startsWith(lang.id))?.id;
  return lang || '';
});

export const recentlyVisitedRadioStations = computed(() => {
  let stations = recentlyVisitedRadioStationIDs.value
    .map((id) => radioStations.value.find((r) => r.id === id))
    .filter((r) => !!r);
  if (stations.length < 10) {
    const langs = [...new Set([userLanguage.value, 'en-UK', 'en-US', 'en'])].filter(Boolean);
    stations = [
      ...stations,
      ...[...radioStations.value]
        .sort((a, b) => langs.indexOf(a.language) - langs.indexOf(b.language))
        .filter((rs) => langs.includes(rs.language) && !stations.some((s) => s.id === rs.id)),
    ];
  }
  return stations.slice(0, 10);
});
export const activeRadioFilterCount = computed(() => {
  return (radioSearchFilters.value?.regions?.length || 0) + (radioSearchFilters.value?.genres?.length || 0);
});

export const getRadioStation = (id: string | undefined): RadioStation | undefined => {
  if (!id) return undefined;
  return radioStations.value.find((r) => r.id === id);
};

export const getRadioStationLanguage = (radioStation: RadioStation): Language | undefined => {
  if (!radioStation) return undefined;
  return radioLanguages.value.find((l) => l.id === radioStation.language);
};

export const addRecentlyVisitedRadioStation = (id: string | undefined) => {
  if (!id) return;
  recentlyVisitedRadioStationIDs.value = [id, ...recentlyVisitedRadioStationIDs.value.filter((s) => s !== id)].slice(
    0,
    10,
  );
};

export const getRadioGenres = (): Genre[] =>
  radioGenres.value
    .filter((g) => radioStations.value.some((r) => r.genres.includes(g.id)))
    .sort((a, b) => a.name.localeCompare(b.name));

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

export const setLastRadioSearchResultQuery = (query: string) => {
  lastRadioSearchResult.value = { query };
};

export const clearLastRadioSearchResult = () => {
  lastRadioSearchResult.value = null;
};

export const playRadioStationByID = (stationID: string | undefined) => {
  playRadioStation(getRadioStation(stationID));
};

export const playRadioStation = (station: RadioStation | undefined, shouldAddToRecentlyVisited = true) => {
  if (!station) return;
  if (shouldAddToRecentlyVisited) {
    addRecentlyVisitedRadioStation(station.id);
  }
  playerState.value = {
    playType: 'radio',
    isPlaying: playerState.value?.isPlaying || true,
    contentID: station.id,
    title: station.name,
    description: '',
    imageUrl: station.logosource,
    streams: station.streams,
    pageLocation: `/radio-station/${station.id}`,
  };
};

export const playNextRadioStation = (isPrev?: boolean) => {
  if (!playerState.value?.contentID) return;
  const currentIndex = recentlyVisitedRadioStationIDs.value.findIndex((s) => s === playerState.value?.contentID);
  if (currentIndex === -1) return;
  let newIndex = isPrev ? currentIndex - 1 : currentIndex + 1;
  if (newIndex < 0) newIndex = recentlyVisitedRadioStationIDs.value.length - 1;
  if (newIndex >= recentlyVisitedRadioStationIDs.value.length) newIndex = 0;
  if (currentIndex === recentlyVisitedRadioStationIDs.value.length - 1) {
    playRadioStation(
      radioStations.value.find((s) => s.id === recentlyVisitedRadioStationIDs.value[newIndex]),
      false,
    );
  } else {
    playRadioStation(
      radioStations.value.find((s) => s.id === recentlyVisitedRadioStationIDs.value[newIndex]),
      false,
    );
  }
};

export const getStationPodcasts = (stationId: string): Podcast[] => {
  return stationPodcasts.value[stationId] || [];
};

export const setStationPodcasts = (podcastData: Record<string, Podcast[]>) => {
  stationPodcasts.value = podcastData;
};
