import { useRoute } from 'preact-iso';
import { useCallback, useEffect, useMemo, useState } from 'preact/hooks';
import { useHead } from '~/hooks/useHead';
import { useRadioBrowser } from '~/hooks/useRadioBrowser';
import { isDBLoaded } from '~/store/db/db';
import { playerState } from '~/store/signals/player';
import {
  addRadioBrowserStation,
  followRadioStation,
  getRadioStation,
  getStationPodcasts,
  isFollowedRadioStation,
  RADIO_BROWSER_PARAM_PREFIX,
  radioStations,
  unfollowRadioStation,
} from '~/store/signals/radio';
import { uiState } from '~/store/signals/ui';

export const useRadioStation = () => {
  const { params } = useRoute();
  const { getStation: getRadioBrowserStation } = useRadioBrowser();
  const [isFollowing, setIsFollowing] = useState(isFollowedRadioStation(params.id));
  const localRadioStationData = getRadioStation(params.id);
  const [radioStation, setRadioStation] = useState(localRadioStationData);
  const [isFetchingData, setIsFetchingData] = useState(typeof window !== 'undefined' && !localRadioStationData);

  useEffect(() => {
    if (radioStation?.id && localRadioStationData?.id && localRadioStationData?.id !== radioStation?.id) {
      setRadioStation(localRadioStationData);
    }
  }, [localRadioStationData, params.id, radioStation?.id]);

  useEffect(() => {
    const fetchRadioStation = async () => {
      const station = await getRadioBrowserStation(params.id);
      if (station) {
        setRadioStation(station);
        addRadioBrowserStation(station);
      }
      setIsFetchingData(false);
    };

    if (isFetchingData && isDBLoaded.value) {
      fetchRadioStation();
    }
  }, [isFetchingData, isDBLoaded.value, getRadioBrowserStation, params.id]);

  const radioStationDescription = useMemo(() => {
    if (!radioStation) return undefined;
    if (radioStation.language.indexOf('nl') === 0) {
      return `Luister naar ${radioStation.name} live op 1tuner.com`;
    } else if (radioStation.language.indexOf('de') === 0) {
      return `Hören Sie ${radioStation.name} live auf 1tuner.com`;
    } else if (radioStation.language.indexOf('fr') === 0) {
      return `Écoutez ${radioStation.name} en direct sur 1tuner.com`;
    } else if (radioStation.language.indexOf('es') === 0) {
      return `Escucha ${radioStation.name} en vivo en 1tuner.com`;
    } else if (radioStation.language.indexOf('it') === 0) {
      return `Ascolta ${radioStation.name} in diretta su 1tuner.com`;
    } else if (radioStation.language.indexOf('pt') === 0) {
      return `Ouça ${radioStation.name} ao vivo no 1tuner.com`;
    } else if (radioStation.language.indexOf('pl') === 0) {
      return `Słuchaj ${radioStation.name} na żywo na 1tuner.com`;
    } else if (radioStation.language.indexOf('sv') === 0) {
      return `Lyssna på ${radioStation.name} live på 1tuner.com`;
    } else {
      return `Listen to ${radioStation.name} live on 1tuner.com`;
    }
  }, [radioStation]);

  useHead({
    title: radioStation ? radioStation.name : 'Radio Station',
    description: radioStationDescription,
    image: radioStation?.logosource,
    url: radioStation ? `https://1tuner.com/radio-station/${radioStation.id}` : undefined,
    type: 'music.radio_station',
  });

  const isPlaying = useMemo(() => {
    return !!(playerState.value?.isPlaying && playerState.value.contentID === radioStation?.id);
  }, [radioStation?.id]);

  const toggleFollow = () => {
    if (!radioStation) return;

    if (isFollowing) {
      unfollowRadioStation(radioStation.id);
    } else {
      followRadioStation(radioStation.id);
    }
    setIsFollowing(!isFollowing);
  };

  const stationPodcasts = useMemo(() => {
    return radioStation?.id ? getStationPodcasts(radioStation.id) : [];
  }, [radioStation?.id]);

  useEffect(() => {
    setIsFollowing(isFollowedRadioStation(params.id));
  }, [setIsFollowing, params.id]);

  useEffect(() => {
    if (!isDBLoaded.value || isFetchingData) return;
    const previousState = { ...uiState.value };
    uiState.value = {
      ...previousState,
      headerTitle: radioStation?.name ?? '',
      headerDefaultTextColor: 'light',
    };

    return () =>
      (uiState.value = {
        ...previousState,
        headerTitle: '',
        headerDefaultTextColor: 'default',
      });
  }, [isDBLoaded.value, isFetchingData, radioStation?.name]);

  const getRelatedStations = useCallback(
    (maxResults: number) => {
      if (!radioStation || !radioStations.value?.length || maxResults <= 0) {
        return [];
      }
      const genreSet = new Set(radioStation.genres ?? []);
      const language = radioStation.language;
      const stationId = radioStation.id;

      // 1. Add explicitly related stations first (in order)
      const result = radioStation.related
        ? radioStation.related
            .map((relId) => radioStations.value.find((s) => s.id === relId))
            .filter((s): s is (typeof radioStations.value)[0] => !!s && s.id !== stationId)
            .slice(0, maxResults)
        : [];

      // Helper to check if genres match exactly
      const genresMatch = (a: string[], b: string[]) => a.length === b.length && a.every((g) => b.includes(g));

      // 2. Exact match: same genres and same language
      for (const s of radioStations.value) {
        if (result.length >= maxResults) break;
        if (
          s.id !== stationId &&
          s.language === language &&
          genresMatch(s.genres, radioStation.genres) &&
          !result.some((r) => r.id === s.id)
        ) {
          result.push(s);
        }
      }

      const overlappingStations = radioStations.value
        .filter(
          (s) =>
            s.id !== stationId && !genresMatch(s.genres, radioStation.genres) && !result.some((r) => r.id === s.id),
        )
        .map((s) => ({
          station: s,
          overlap: s.genres.filter((g) => genreSet.has(g)).length,
        }))
        .filter((item) => item.overlap > 0)
        .sort((a, b) => b.overlap - a.overlap)
        .map((item) => item.station);

      // 3. Most overlapping genres, same language (not already included)
      for (const s of overlappingStations.filter((s) => s.language === language)) {
        if (result.length >= maxResults) break;
        result.push(s);
      }

      // 4. Same genres, other languages
      for (const s of radioStations.value) {
        if (result.length >= maxResults) break;
        if (
          s.id !== stationId &&
          s.language !== language &&
          genresMatch(s.genres, radioStation.genres) &&
          !result.some((r) => r.id === s.id)
        ) {
          result.push(s);
        }
      }

      // 5. Most overlapping genres, other languages (not already included)
      for (const s of overlappingStations.filter((s) => s.language !== language)) {
        if (result.length >= maxResults) break;
        result.push(s);
      }

      return result.slice(0, maxResults);
    },
    [radioStation, radioStations.value],
  );

  const relatedStations = useMemo(() => {
    return getRelatedStations(8);
  }, [getRelatedStations]);

  return {
    params,
    isPlaying,
    isFetchingData,
    isRadioBrowserStation: params.id.startsWith(RADIO_BROWSER_PARAM_PREFIX),
    radioStation,
    stationPodcasts,
    isFollowing,
    relatedStations,
    toggleFollow,
  };
};
