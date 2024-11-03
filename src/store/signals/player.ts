import { signal } from '@preact/signals';
import { PlayerState } from '~/store/types';

export const playerState = signal<PlayerState | null>(null);

export const setPlayerState = (state: Omit<PlayerState, 'isMaximized'>) => {
  playerState.value = {
    ...state,
    isMaximized: !!playerState.value?.isMaximized,
  };
};

export const togglePlayPause = () => {
  if (playerState.value) {
    playerState.value = {
      ...playerState.value,
      isPlaying: !playerState.value.isPlaying,
    };
  }
};

export const togglePlayerMaximized = () => {
  if (playerState.value) {
    playerState.value = {
      ...playerState.value,
      isMaximized: !playerState.value.isMaximized,
    };
  }
};
