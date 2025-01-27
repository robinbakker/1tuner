import { useRoute } from 'preact-iso';
import { useCallback, useMemo } from 'preact/hooks';
import { useHead } from '~/hooks/useHead';
import { getRadioStation } from '~/store/signals/radio';
import { RadioStation } from '~/store/types';

interface TimeRadioStation {
  time: string;
  station: RadioStation;
}

export const usePlaylist = () => {
  const { params, query } = useRoute();

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

  useHead({
    title: playlistName ? `${decodeURI(params.name).trim()}` : 'Playlist',
    url: playlistName
      ? `${import.meta.env.VITE_BASE_URL}/playlist/${encodeURI(playlistName)}/${playlistQueryString}`
      : undefined,
    type: 'music.playlist',
  });

  return {
    playlistName: playlistName || 'Playlist',
    playlist,
  };
};
