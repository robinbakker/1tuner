import { useLocation, useRoute } from 'preact-iso';
import { useCallback, useEffect, useMemo, useState } from 'preact/hooks';
import { useHead } from '~/hooks/useHead';
import { getLocalTimeFromUrlKey, getValidTimeZone } from '~/lib/convertTime';
import { playlists } from '~/store/signals/playlist';
import { getRadioStation } from '~/store/signals/radio';
import { Playlist, RadioStation } from '~/store/types';

interface TimeRadioStation {
  time: string;
  station: RadioStation;
}

export const usePlaylist = () => {
  const { params, query } = useRoute();
  const { route } = useLocation();
  const [isEditMode, setIsEditMode] = useState(false);
  const isAddNew = !params.name && !Object.keys(query ?? {}).length;

  const playlistName = useMemo(() => {
    return params.name ? decodeURI(params.name).trim() : undefined;
  }, [params.name]);

  const getParamFromTime = useCallback((time: string) => {
    const [hour, minute] = time.split(':');
    return `h${hour}` + (minute === '00' ? '' : `m${minute}`);
  }, []);

  const urlTimeZone = useMemo(() => {
    return query['tz'] as string | undefined;
  }, [query]);

  const playlist = useMemo(() => {
    const list: TimeRadioStation[] = [];
    Object.keys(query).forEach((key) => {
      if (key === 'tz') return;
      const time = getLocalTimeFromUrlKey(key, urlTimeZone);
      const station = getRadioStation(query[key] as string);
      if (time && station) {
        list.push({ time, station });
      }
    });
    list.sort((a, b) => a.time.localeCompare(b.time));
    return list;
  }, [query]);

  const playlistQueryString = useMemo(() => {
    const result = playlist.map((i) => getParamFromTime(i.time) + '=' + i.station.id).join('&');
    const timeZone = getValidTimeZone(urlTimeZone);
    return result ? `?${result}&tz=${timeZone}` : '';
  }, [playlist]);

  const playlistUrl = useMemo(() => {
    return playlistName
      ? `${import.meta.env.VITE_BASE_URL}/playlist/${encodeURI(playlistName)}/${playlistQueryString}`
      : undefined;
  }, [playlistName, playlistQueryString]);

  useHead({
    url: playlistUrl,
    title: playlistName ? `${decodeURI(params.name).trim()}` : 'Playlist',
    type: 'music.playlist',
  });

  useEffect(() => {
    if (!(playlists.value || []).some((p) => p.url === playlistUrl)) {
      setIsEditMode(true);
    }
  }, [playlistUrl, playlists.value]);

  const handleSaveClick = useCallback(() => {
    playlists.value = [
      ...(playlists.value || []),
      { name: playlistName, url: playlistUrl, items: playlist.map((p) => ({ time: p.time, stationID: p.station.id })) },
    ] as Playlist[];
    setIsEditMode(false);
  }, []);

  const handleCancelClick = useCallback(() => {
    if (isAddNew) route('/playlists');
    setIsEditMode(false);
  }, []);

  return {
    playlistName: playlistName || 'Playlist',
    playlist,
    isEditMode,
    handleSaveClick,
    handleCancelClick,
  };
};
