import { playerState } from './signals/player';
import { updatePodcastEpisodeCurrentTime } from './signals/podcast';
import { PlayerState } from './types';

export const PLAYBACK_CHECKPOINT_MS = 5000;

let readProgress: (() => void) | undefined;

// Called synchronously before persistence, including visibility/pagehide saves.
export const snapshotPlaybackProgress = () => readProgress?.();

export const trackPlaybackProgress = (audio: HTMLAudioElement, owner: PlayerState, save: () => void) => {
  if (owner.playType !== 'podcast') return;
  const url = owner.streams[0]?.url;
  if (!url) return;
  let lastCheckpoint = Date.now();

  const snapshot = () => {
    // An unloaded element's zero is not a new listening position.
    if (audio.readyState === 0 || !Number.isFinite(audio.currentTime) || audio.currentTime < 0) return;
    const position = audio.currentTime;
    updatePodcastEpisodeCurrentTime(owner.contentID, url, position);
    const active = playerState.peek();
    if (
      active?.playType === 'podcast' &&
      active.contentID === owner.contentID &&
      active.streams[0]?.url === url &&
      active.currentTime !== position
    ) {
      playerState.value = { ...active, currentTime: position };
    }
  };

  const checkpoint = () => {
    lastCheckpoint = Date.now();
    snapshot();
    save();
  };
  const onTimeUpdate = () => {
    if (Date.now() - lastCheckpoint >= PLAYBACK_CHECKPOINT_MS) checkpoint();
  };

  readProgress = snapshot;
  audio.addEventListener('timeupdate', onTimeUpdate);
  audio.addEventListener('seeked', checkpoint);
  audio.addEventListener('pause', checkpoint);

  return () => {
    // This closure retains the outgoing episode and element even after state changes.
    snapshot();
    if (readProgress === snapshot) readProgress = undefined;
    audio.removeEventListener('timeupdate', onTimeUpdate);
    audio.removeEventListener('seeked', checkpoint);
    audio.removeEventListener('pause', checkpoint);
    save();
  };
};
