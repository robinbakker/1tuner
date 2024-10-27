import { signal } from '@preact/signals';

interface AudioPlayerState {
  isPlaying: boolean;
  isMaximized: boolean;
  title: string;
  description: string;
  imageUrl: string;
}

export const audioPlayer = signal<AudioPlayerState | null>(null);

export function setAudioPlayer(state: Omit<AudioPlayerState, 'isMaximized'>) {
  audioPlayer.value = {
    ...state,
    isMaximized: false,
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
