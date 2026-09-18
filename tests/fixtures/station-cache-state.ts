import { addRadioBrowserStation } from '../../src/store/signals/radio';
import { RadioStation } from '../../src/store/types';

export { playlistUtil } from '../../src/lib/playlistUtil';
export { isDBLoaded, saveStateToDB } from '../../src/store/db/db';
export { playerState } from '../../src/store/signals/player';
export { playlistRules, playlists } from '../../src/store/signals/playlist';
export {
  addRadioBrowserStation,
  followedRadioStationIDs,
  followRadioStation,
  getRadioStation,
  playRadioStationByID,
  radioBrowserStations,
  unfollowRadioStation,
} from '../../src/store/signals/radio';
export { PlaylistRuleType } from '../../src/store/types';

export function station(id: string): RadioStation {
  return {
    id: `rb-${id}`,
    name: `Station ${id}`,
    displayorder: 0,
    logosource: '',
    language: 'en',
    genres: [],
    streams: [{ url: `https://media.example/${id}.mp3`, mimetype: 'audio/mpeg' }],
  };
}

export function churn(prefix = 'recent') {
  for (let i = 0; i < 101; i++) addRadioBrowserStation(station(`${prefix}-${i}`));
}
