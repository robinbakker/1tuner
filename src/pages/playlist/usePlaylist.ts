import { useRoute } from 'preact-iso';
import { useCallback, useEffect, useMemo, useState } from 'preact/hooks';
import { useHead } from '~/hooks/useHead';
import { playlists } from '~/store/signals/playlist';
import { getRadioStation } from '~/store/signals/radio';
import { Playlist, RadioStation } from '~/store/types';

interface TimeRadioStation {
  time: string;
  station: RadioStation;
}

export const usePlaylist = () => {
  const { params, query } = useRoute();
  const [isEditMode, setIsEditMode] = useState(false);

  const playlistName = useMemo(() => {
    return params.name ? decodeURI(params.name).trim() : undefined;
  }, [params.name]);

  const getTimeFromKey = useCallback((key: string) => {
    try {
      const hourMatch = key.match(/h(\d+)/);
      if (!hourMatch) return undefined;
      const hour = hourMatch[1].padStart(2, '0');
      const minuteMatch = key.match(/m(\d+)/);
      const minutes = minuteMatch ? minuteMatch[1].padStart(2, '0') : '00';
      return `${hour}:${minutes}`;
    } catch {
      return undefined;
    }
  }, []);

  const getParamFromTime = useCallback((time: string) => {
    const [hour, minute] = time.split(':');
    return `h${hour}m${minute}`;
  }, []);

  const playlist = useMemo(() => {
    const list: TimeRadioStation[] = [];
    Object.keys(query).forEach((key) => {
      console.log(key, query[key]);
      const time = getTimeFromKey(key);
      const station = getRadioStation(query[key] as string);
      if (time && station) {
        list.push({ time, station });
      }
    });
    list.sort((a, b) => a.time.localeCompare(b.time));
    console.log(list);
    return list;
  }, [query]);

  const playlistQueryString = useMemo(() => {
    const result = playlist.map((i) => getParamFromTime(i.time) + '=' + i.station.id).join('&');
    return result ? `?${result}` : '';
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
