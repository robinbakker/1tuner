import { playerState } from './signals/player';
import { updatePodcastEpisodeCurrentTime } from './signals/podcast';
import { PlayerState } from './types';

export const PLAYBACK_CHECKPOINT_MS = 5000;

let readProgress: (() => void) | undefined;
let readRemoteProgress: (() => void) | undefined;

// Called synchronously before persistence, including visibility/pagehide saves.
export const snapshotPlaybackProgress = () => (readRemoteProgress ?? readProgress)?.();

const updateProgress = (owner: PlayerState, position: number) => {
  const stream = owner.streams[0];
  if (owner.playType !== 'podcast' || !stream?.url || !Number.isFinite(position) || position < 0) return;
  updatePodcastEpisodeCurrentTime(owner.contentID, stream.url, position);
  const active = playerState.peek();
  if (
    active?.playType === owner.playType &&
    active.contentID === owner.contentID &&
    active.streams[0]?.url === stream.url &&
    active.streams[0]?.mimetype === stream.mimetype &&
    active.currentTime !== position
  ) {
    playerState.value = { ...active, currentTime: position };
  }
};

export const trackRemotePlaybackProgress = (
  owner: PlayerState,
  readPosition: () => number | undefined,
  save: () => void,
) => {
  if (owner.playType !== 'podcast' || !owner.streams[0]?.url) return;
  const snapshot = () => {
    const position = readPosition();
    if (position !== undefined) updateProgress(owner, position);
  };
  const checkpoint = () => {
    snapshot();
    save();
  };
  readRemoteProgress = snapshot;
  snapshot();
  const timer = window.setInterval(checkpoint, PLAYBACK_CHECKPOINT_MS);
  return {
    checkpoint,
    dispose: () => {
      window.clearInterval(timer);
      checkpoint();
      if (readRemoteProgress === snapshot) readRemoteProgress = undefined;
    },
  };
};

export const trackPlaybackProgress = (audio: HTMLAudioElement, owner: PlayerState, save: () => void) => {
  if (owner.playType !== 'podcast') return;
  const url = owner.streams[0]?.url;
  if (!url) return;
  let lastCheckpoint = Date.now();

  const snapshot = () => {
    // A joined receiver may attach before the local effect has cleaned up.
    if (readRemoteProgress) return;
    // An unloaded element's zero is not a new listening position.
    if (audio.readyState === 0 || !Number.isFinite(audio.currentTime) || audio.currentTime < 0) return;
    updateProgress(owner, audio.currentTime);
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
