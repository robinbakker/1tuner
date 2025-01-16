import { useRoute } from 'preact-iso';
import { useEffect, useMemo, useState } from 'preact/hooks';
import { useHead } from '~/hooks/useHead';
import { playerState } from '~/store/signals/player';
import {
  addRecentlyVisitedRadioStation,
  followRadioStation,
  getRadioStation,
  getStationPodcasts,
  isFollowedRadioStation,
  unfollowRadioStation,
} from '~/store/signals/radio';
import { uiState } from '~/store/signals/ui';

export const useRadioStation = () => {
  const { params } = useRoute();
  const radioStation = getRadioStation(params.id);
  const [isFollowing, setIsFollowing] = useState(isFollowedRadioStation(params.id));

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
    return !!(playerState.value && playerState.value.isPlaying && playerState.value.contentID === radioStation?.id);
  }, [playerState.value, radioStation?.id]);

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
  }, [setIsFollowing, isFollowedRadioStation, params.id]);

  useEffect(() => {
    addRecentlyVisitedRadioStation(radioStation?.id);
  }, [radioStation, addRecentlyVisitedRadioStation]);

  useEffect(() => {
    uiState.value = {
      headerTitle: radioStation?.name ?? '',
      headerDefaultTextColor: 'light',
    };

    return () =>
      (uiState.value = {
        headerTitle: '',
        headerDefaultTextColor: 'default',
      });
  });

  return {
    params,
    isPlaying,
    radioStation,
    stationPodcasts,
    isFollowing,
    toggleFollow,
  };
};
