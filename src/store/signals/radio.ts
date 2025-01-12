import { signal } from '@preact/signals';
import { Genre, Language, RadioSearchResult, RadioStation } from '~/store/types';

export const radioStations = signal<RadioStation[]>([]);
export const radioLanguages = signal<Language[]>([]);
export const radioGenres = signal<Genre[]>([]);
export const followedRadioStationIDs = signal<string[]>([]);
export const recentlyVisitedRadioStationIDs = signal<string[]>([]);
export const lastRadioSearchResult = signal<RadioSearchResult | null>(null);

export const getRadioStation = (id: string): RadioStation | undefined => {
  if (!id) return undefined;
  return radioStations.value.find((r) => r.id === id);
};

export const getRadioStationLanguage = (radioStation: RadioStation): Language | undefined => {
  if (!radioStation) return undefined;
  return radioLanguages.value.find((l) => l.id === radioStation.language);
};

export const getRecentlyVisitedRadioStations = (): RadioStation[] => {
  const stations = recentlyVisitedRadioStationIDs.value.map((id) => getRadioStation(id)).filter((r) => !!r);
  return [...stations, ...radioStations.value.filter((rs) => !stations.some((s) => s.id === rs.id))].slice(
    0,
    10,
  ) as RadioStation[];
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

export const setLastRadioSearchResult = (query: string, result: RadioStation[]) => {
  lastRadioSearchResult.value = { query, result };
};

export const clearLastRadioSearchResult = () => {
  lastRadioSearchResult.value = null;
};
