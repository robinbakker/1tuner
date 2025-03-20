import { playerState } from '~/store/signals/player';
import { playlists } from '~/store/signals/playlist';
import { getRadioStation } from '~/store/signals/radio';
import { Playlist, PlaylistItem } from '~/store/types';
import { getLocalTimeFromUrlKey } from './convertTime';
import { getTimeInMinutesFromTimeString } from './utils';

const isSameUrl = (url1: string | undefined, url2: string | undefined) => {
  if (!url1 || !url2) return false;
  if (url1.toLocaleLowerCase() === url2.toLocaleLowerCase()) return true;

  const url1Params = new URLSearchParams(url1.split('?')[1]);
  const url2Params = new URLSearchParams(url2.split('?')[1]);
  url1Params.delete('tz');
  url2Params.delete('tz');
  const normalizedParams1 = Array.from(url1Params.entries())
    .map(([key, value]) => getLocalTimeFromUrlKey(key) + value)
    .sort();
  const normalizedParams2 = Array.from(url2Params.entries())
    .map(([key, value]) => getLocalTimeFromUrlKey(key) + value)
    .sort();

  return JSON.stringify(normalizedParams1) === JSON.stringify(normalizedParams2);
};

const playPlaylistByUrl = (playlistUrl: string | undefined, shouldPlay?: boolean) => {
  if (!playlistUrl) return;
  const currentPlaylist = playlists.value?.find((p) => isSameUrl(p.url, playlistUrl));
  playPlaylist(currentPlaylist, shouldPlay);
};

const playPlaylist = (playlist: Playlist | undefined, shouldPlay?: boolean) => {
  if (!playlist) return;
  const now = new Date();
  const minutes = now.getHours() * 60 + now.getMinutes();
  const currentItemIndex = playlist.items.findIndex(
    (i, index) =>
      getTimeInMinutesFromTimeString(i.time) < minutes &&
      (!playlist.items[index + 1] || getTimeInMinutesFromTimeString(playlist.items[index + 1].time) > minutes),
  );
  const currentItem = playlist.items[currentItemIndex];
  const currentStation = getRadioStation(currentItem?.stationID ?? '');
  const nextItem =
    currentItemIndex + 1 < playlist.items.length ? playlist.items[currentItemIndex + 1] : playlist.items[0];
  const nextStation = getRadioStation(nextItem?.stationID ?? '');
  if (!currentStation) return;
  //const isInCurrentPlaystate = playerState.value?.pageLocation === currentPlaylist.url;

  if (!currentStation || !nextStation) {
    console.error('No station found');
    return;
  }

  playerState.value = {
    playType: 'playlist',
    isPlaying: shouldPlay || playerState.value?.isPlaying || false,
    contentID: playlist.url,
    title: playlist.name,
    description: `${currentItem.time} ${currentStation.name} - ${nextItem.time} ${nextStation.name}`,
    imageUrl: currentStation.logosource,
    streams: currentStation.streams,
    pageLocation: playlist.url,
  };
};

const getPlaylistDataByUrl = (url: string) => {
  if (!url) return null;
  const urlObj = new URL(url.startsWith('http') ? url : `https://1tuner.com/${url}`);
  const query = Object.fromEntries(urlObj.searchParams.entries());
  const name = decodeURIComponent(urlObj.pathname.replaceAll('//', '/').split('/')?.[2] ?? '');
  const list: PlaylistItem[] = [];
  Object.keys(query).forEach((key) => {
    if (key === 'tz') return;
    const startTime = getLocalTimeFromUrlKey(key);
    const station = getRadioStation(query[key] as string);
    if (startTime && station) {
      list.push({ time: startTime, stationID: station.id });
    }
  });
  return {
    name,
    url: urlObj.pathname + urlObj.search,
    items: list.sort((a, b) => a.time.localeCompare(b.time)),
    timeZone: query.tz as string | undefined,
  } as Playlist;
};

export const playlistUtil = {
  playPlaylistByUrl,
  playPlaylist,
  isSameUrl,
  getPlaylistDataByUrl,
};
