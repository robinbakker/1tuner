export { isDBLoaded, saveStateToDB } from '../../src/store/db/db';
export { playerState } from '../../src/store/signals/player';
export { playlistRules, playlists } from '../../src/store/signals/playlist';
export { followPodcast, followedPodcasts, unfollowPodcast } from '../../src/store/signals/podcast';
export { followRadioStation, followedRadioStationIDs, unfollowRadioStation } from '../../src/store/signals/radio';
export { addRadioBrowserStation, station } from './station-cache-state';

export let writeCount = 0;
export function countWrites() {
  const original = IDBDatabase.prototype.transaction;
  IDBDatabase.prototype.transaction = function (...args: Parameters<typeof original>) {
    if (this.name === '1tuner' && args[1] === 'readwrite') writeCount++;
    return original.apply(this, args);
  };
}
