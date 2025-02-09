import { useLocation, useRoute } from 'preact-iso';
import { useCallback, useEffect, useMemo, useRef, useState } from 'preact/hooks';
import { useHead } from '~/hooks/useHead';
import { getLocalTimeFromUrlKey, getValidTimeZone } from '~/lib/convertTime';
import { getTimeInMinutesFromTimeString, getTimeStringFromMinutes, roundTo15Minutes } from '~/lib/utils';
import { playlists } from '~/store/signals/playlist';
import { getRadioStation } from '~/store/signals/radio';
import { addToast, uiState } from '~/store/signals/ui';
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
    return playlistName && playlistQueryString
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

  const getPlaylistUrlFromBlocks = useCallback(() => {
    if (!editName || !blocks.length) return '';
    const query = blocks
      .map((b) => {
        const time = getParamFromTime(b.startTime);
        const station = b.station?.id;
        return `${time}=${station}`;
      })
      .join('&');
    const timeZone = getValidTimeZone(urlTimeZone);
    return `${import.meta.env.VITE_BASE_URL}/playlist/${encodeURI(editName)}/${query ? `?${query}&tz=${timeZone}` : ''}`;
  }, [blocks, editName, urlTimeZone]);

  useEffect(() => {
    if (isEditMode) {
      uiState.value = { ...uiState.value, headerTitle: '' };
    } else {
      uiState.value = { ...uiState.value, headerTitle: playlistName || 'Playlist' };
    }
    return () => (uiState.value = { ...uiState.value, headerTitle: '' });
  }, [isEditMode]);

  useEffect(() => {
    if (!(playlists.value || []).some((p) => !!p.url && p.url === playlistUrl)) {
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
        } as ScheduleBlock;
      });
      if (!newBlocks.length) {
        newBlocks.push({
          startTime: '00:00',
          endTime: '23:59',
          top: 0,
          height: 100,
        } as ScheduleBlock);
      }
      setBlocks(newBlocks);
    }
  }, [
    playlistUrl,
    playlists.value,
    setIsEditMode,
    setEditName,
    playlistName,
    playlist,
    getBlockTopPercentage,
    setBlocks,
  ]);

  const handleSaveClick = useCallback(() => {
    if (!editName) {
      addToast({
        title: "Can't save...",
        description: 'Please enter a playlist name',
      });
      return;
    }
    if (blocks.length < 2 || [...new Set(blocks.map((b) => b.station?.id))].length < 2) {
      addToast({
        title: "Can't save...",
        description: 'Please add at least 2 different station blocks',
      });
      return;
    }
    if (blocks.some((b) => !b.station)) {
      addToast({
        title: "Can't save...",
        description: 'Please ensure all blocks have a station selected',
      });
      return;
    }
    playlists.value = [
      ...(playlists.value || []).filter((p) => !playlistUrl || p.url !== playlistUrl),
      {
        name: editName,
        url: getPlaylistUrlFromBlocks(),
        items: blocks.map((b) => ({ time: b.startTime, stationID: b.station?.id })),
      },
    ] as Playlist[];
    route('/playlists');
    setIsEditMode(false);
  }, [blocks, editName, playlistUrl, playlists.value, getPlaylistUrlFromBlocks, addToast, setIsEditMode]);

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
    (e: MouseEvent | TouchEvent, blockIndex: number) => {
      e.preventDefault();
      if (!containerRef.current) return;

      containerRef.current.classList.add('is-dragging');
      const dividerRect = (e.target as HTMLElement).getBoundingClientRect();
      const containerRect = containerRef.current.getBoundingClientRect();
      const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;

      setDragInfo({
        blockIndex,
        startY: clientY,
        dividerInitialY: dividerRect.top - containerRect.top,
        containerHeight: containerRect.height,
      });
    },
    [containerRef],
  );

  const rafRef = useRef<number>();

  const handleDrag = useCallback(
    (e: MouseEvent | TouchEvent) => {
      if (!containerRef.current || !dragInfo) return;
      e.preventDefault();
      e.stopPropagation();

      // Cancel any pending animation frame
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
      }

      // Schedule the update
      rafRef.current = requestAnimationFrame(() => {
        const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
        const containerRect = containerRef.current!.getBoundingClientRect();
        const relativeY = Math.max(0, Math.min(clientY - containerRect.top, containerRect.height));
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
          topBlock.height = getBlockTopPercentage(newTimeString) - topBlock.top;

          bottomBlock.startTime = newTimeString;
          bottomBlock.top = getBlockTopPercentage(newTimeString);
          bottomBlock.height = getBlockTopPercentage(bottomBlock.endTime) - bottomBlock.top;

          setBlocks(updatedBlocks);
        }
      });
    },
    [blocks, dragInfo, containerRef],
  );

  const handleDragEnd = useCallback(() => {
    containerRef.current?.classList.remove('is-dragging');
    setDragInfo(undefined);
  }, [handleDrag]);

  useEffect(() => {
    const handleTouchMove = (e: TouchEvent) => handleDrag(e);
    const handleMouseMove = (e: MouseEvent) => handleDrag(e);

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('touchmove', handleTouchMove, { passive: false });
    window.addEventListener('mouseup', handleDragEnd);
    window.addEventListener('touchend', handleDragEnd);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('mouseup', handleDragEnd);
      window.removeEventListener('touchend', handleDragEnd);
    };
  }, [handleDrag, handleDragEnd]);

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

  const handleEditClick = useCallback(() => {
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
      } as ScheduleBlock;
    });
    if (!newBlocks.length) {
      newBlocks.push({
        startTime: '00:00',
        endTime: '23:59',
        top: 0,
        height: 100,
      } as ScheduleBlock);
    }
    setBlocks(newBlocks);
  }, [playlist, playlistName, setEditName, setIsEditMode]);

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
    handleDragStart,
    handleAddBlock,
    handleEditClick,
  };
};
