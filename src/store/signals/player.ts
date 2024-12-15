import { signal } from '@preact/signals';
import { PlayerState } from '~/store/types';

export const isPlayerMaximized = signal(false);
export const playerState = signal<PlayerState | null>(null);

export const togglePlayPause = () => {
  if (playerState.value) {
    playerState.value = {
      ...playerState.value,
      isPlaying: !playerState.value.isPlaying,
    };
  }
};

export const togglePlayerMaximized = () => {
  isPlayerMaximized.value = !isPlayerMaximized.value;
};
