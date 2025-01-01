import { useRoute } from 'preact-iso';
import { useEffect, useMemo, useState } from 'preact/hooks';
import { playerState } from '~/store/signals/player';
import {
  addRecentlyVisitedRadioStation,
  followRadioStation,
  getRadioStation,
  isFollowedRadioStation,
  unfollowRadioStation,
} from '~/store/signals/radio';
import { uiState } from '~/store/signals/ui';

export const useRadioStation = () => {
  const { params } = useRoute();
  const radioStation = getRadioStation(params.id);
  const [isFollowing, setIsFollowing] = useState(isFollowedRadioStation(params.id));

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
    isPlaying,
    radioStation,
    isFollowing,
    toggleFollow,
  };
};
