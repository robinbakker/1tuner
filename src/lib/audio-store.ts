import { signal } from '@preact/signals';
import { Stream } from '~/components/types';

interface AudioPlayerState {
  isPlaying: boolean;
  isMaximized: boolean;
  title: string;
  description?: string;
  imageUrl: string;
  streams: Stream[];
  pageLocation: string;
}

export const audioPlayer = signal<AudioPlayerState | null>(null);

export function setAudioPlayer(state: Omit<AudioPlayerState, 'isMaximized'>) {
  audioPlayer.value = {
    ...state,
    isMaximized: !!audioPlayer.value?.isMaximized,
  };
}

export function clearAudioPlayer() {
  audioPlayer.value = null;
}

export function togglePlayPause() {
  if (audioPlayer.value) {
    audioPlayer.value = {
      ...audioPlayer.value,
      isPlaying: !audioPlayer.value.isPlaying,
    };
  }
}

export function toggleMaximized() {
  if (audioPlayer.value) {
    audioPlayer.value = {
      ...audioPlayer.value,
      isMaximized: !audioPlayer.value.isMaximized,
    };
  }
}
