import { JSXInternal } from 'node_modules/preact/src/jsx';
import { useLocation, useRoute } from 'preact-iso';
import { useCallback, useEffect, useMemo, useRef, useState } from 'preact/hooks';
import { useHead } from '~/hooks/useHead';
import { getLocalTimeFromUrlKey, getValidTimeZone } from '~/lib/convertTime';
import { getTimeInMinutesFromTimeString, getTimeStringFromMinutes, roundTo15Minutes } from '~/lib/utils';
import { playlists } from '~/store/signals/playlist';
import { getRadioStation } from '~/store/signals/radio';
import { Playlist, RadioStation } from '~/store/types';

interface TimeRadioStation {
  time: string;
  station: RadioStation;
}

interface ScheduleBlock {
  startTime: string;
  endTime: string;
  station?: RadioStation;
  top: number;
  height: number;
}

interface DragInfo {
  blockIndex: number;
  startY: number;
  dividerInitialY: number;
  containerHeight: number;
}

export const usePlaylist = () => {
  const { params, query } = useRoute();
  const { route } = useLocation();
  const [isEditMode, setIsEditMode] = useState(false);
  const [editName, setEditName] = useState<string>();
  const [blocks, setBlocks] = useState<ScheduleBlock[]>([]);
  const [dragInfo, setDragInfo] = useState<DragInfo>();
  const containerRef = useRef<HTMLDivElement>(null);
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

  const getBlockTopPercentage = useCallback((startTime: string) => {
    const startMinutes = getTimeInMinutesFromTimeString(startTime);
    return (startMinutes / (24 * 60)) * 100;
  }, []);

  useEffect(() => {
    if (!(playlists.value || []).some((p) => p.url === playlistUrl)) {
      setIsEditMode(true);
      setEditName(playlistName || '');

      const newBlocks = playlist.map((p, i) => {
        const endTime = playlist[i + 1]?.time || '23:59';
        return {
          startTime: p.time,
          endTime: endTime,
          station: p.station,
          top: getBlockTopPercentage(p.time),
          height: getBlockTopPercentage(endTime) - getBlockTopPercentage(p.time),
        };
      });
      setBlocks(newBlocks);
    }
  }, [playlistUrl, playlists.value]);

  const handleSaveClick = useCallback(() => {
    if (!editName) return;
    playlists.value = [
      ...(playlists.value || []),
      { name: editName, url: playlistUrl, items: playlist.map((p) => ({ time: p.time, stationID: p.station.id })) },
    ] as Playlist[];
    setIsEditMode(false);
  }, []);

  const handleCancelClick = useCallback(() => {
    if (isAddNew) route('/playlists');
    setIsEditMode(false);
  }, []);

  const handleNameInput = useCallback((e: Event) => {
    const target = e.currentTarget as HTMLInputElement;
    setEditName(target.value);
  }, []);

  const handleStationChange = useCallback(
    (blockIndex: number, stationID: string) => {
      const newBlocks = [...blocks];
      newBlocks[blockIndex].station = getRadioStation(stationID);
      setBlocks(newBlocks);
    },
    [blocks],
  );

  const handleDeleteBlock = useCallback(
    (blockIndex: number) => {
      if (blocks.length <= 1) return;

      const updatedBlocks = [...blocks];

      if (blockIndex === 0) {
        updatedBlocks[1].startTime = '00:00';
        updatedBlocks[1].top = 0;
        updatedBlocks[1].height = getBlockTopPercentage(updatedBlocks[1].endTime);
      } else if (blockIndex === blocks.length - 1) {
        updatedBlocks[blockIndex - 1].endTime = '23:59';
        updatedBlocks[blockIndex - 1].height = 100 - updatedBlocks[blockIndex - 1].top;
      } else {
        updatedBlocks[blockIndex - 1].endTime = updatedBlocks[blockIndex].endTime;
        updatedBlocks[blockIndex - 1].height =
          getBlockTopPercentage(updatedBlocks[blockIndex].endTime) - updatedBlocks[blockIndex - 1].top;
      }

      updatedBlocks.splice(blockIndex, 1);
      setBlocks(updatedBlocks);
    },
    [blocks],
  );

  const handleDragStart = useCallback(
    (e: JSXInternal.TargetedDragEvent<HTMLDivElement>, blockIndex: number) => {
      if (!containerRef.current) return;

      const dividerRect = e.currentTarget.getBoundingClientRect();
      const containerRect = containerRef.current.getBoundingClientRect();

      setDragInfo({
        blockIndex,
        startY: e.clientY,
        dividerInitialY: dividerRect.top - containerRect.top,
        containerHeight: containerRect.height,
      });
    },
    [containerRef],
  );

  const handleDrag = useCallback(
    (e: MouseEvent) => {
      if (!containerRef.current || !dragInfo || !e.clientY) return;

      const containerRect = containerRef.current.getBoundingClientRect();
      const relativeY = e.clientY - containerRect.top;
      const totalMinutes = 24 * 60;
      const minutesPerPixel = totalMinutes / containerRect.height;

      const newTime = roundTo15Minutes(relativeY * minutesPerPixel);

      const offset = 59;
      const startTimeMins = getTimeInMinutesFromTimeString(blocks[dragInfo.blockIndex].startTime) + offset;
      const endTimeMins = getTimeInMinutesFromTimeString(blocks[dragInfo.blockIndex + 1].endTime) - offset;

      if (newTime > startTimeMins && newTime < endTimeMins) {
        const updatedBlocks = [...blocks];
        const newTimeString = getTimeStringFromMinutes(newTime);
        const topBlock = updatedBlocks[dragInfo.blockIndex];
        const bottomBlock = updatedBlocks[dragInfo.blockIndex + 1];
        topBlock.endTime = newTimeString;
        topBlock.height = getBlockTopPercentage(newTimeString) - updatedBlocks[dragInfo.blockIndex].top;
        bottomBlock.startTime = newTimeString;
        bottomBlock.top = getBlockTopPercentage(newTimeString);
        bottomBlock.height = getBlockTopPercentage(bottomBlock.endTime) - bottomBlock.top;
        setBlocks(updatedBlocks);
      }
    },
    [blocks, dragInfo, containerRef],
  );

  const handleDragEnd = useCallback(() => {
    setDragInfo(undefined);
  }, []);

  const handleAddBlock = useCallback(() => {
    const lastBlock = blocks[blocks.length - 1];
    const splitPoint = roundTo15Minutes(
      (getTimeInMinutesFromTimeString(lastBlock.startTime) + getTimeInMinutesFromTimeString(lastBlock.endTime)) / 2,
    );
    const splitPointTimeString = getTimeStringFromMinutes(splitPoint);
    const newBlockTop = getBlockTopPercentage(splitPointTimeString);

    setBlocks([
      ...blocks.slice(0, -1),
      {
        ...lastBlock,
        endTime: splitPointTimeString,
        height: newBlockTop - lastBlock.top,
      },
      {
        startTime: splitPointTimeString,
        endTime: lastBlock.endTime,
        top: newBlockTop,
        height: lastBlock.height - newBlockTop,
      },
    ]);
  }, [blocks]);

  return {
    playlistName: playlistName || 'Playlist',
    playlist,
    blocks,
    isEditMode,
    editName,
    containerRef,
    handleNameInput,
    handleSaveClick,
    handleCancelClick,
    handleStationChange,
    handleDeleteBlock,
    handleDrag,
    handleDragStart,
    handleDragEnd,
    handleAddBlock,
  };
};
