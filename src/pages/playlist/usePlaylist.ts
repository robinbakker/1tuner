import { useLocation, useRoute } from 'preact-iso';
import { useCallback, useEffect, useMemo, useRef, useState } from 'preact/hooks';
import { useHead } from '~/hooks/useHead';
import { getLocalTimeFromUrlKey, getValidTimeZone } from '~/lib/convertTime';
import { playlistUtil } from '~/lib/playlistUtil';
import { getTimeInMinutesFromTimeString, getTimeStringFromMinutes, roundTo15Minutes } from '~/lib/utils';
import { isDBLoaded } from '~/store/db/db';
import { playerState } from '~/store/signals/player';
import { playlists } from '~/store/signals/playlist';
import { getRadioStation } from '~/store/signals/radio';
import { addToast, uiState } from '~/store/signals/ui';
import { Playlist, RadioStation } from '~/store/types';

interface ScheduleBlock {
  startTime: string;
  endTime: string;
  station?: RadioStation;
  top?: number;
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
  const [currentTimePosition, setCurrentTimePosition] = useState(0);
  const [showNightSchedule, setShowNightSchedule] = useState(false);

  const toggleNightSchedule = useCallback(() => {
    setShowNightSchedule((prev) => !prev);
  }, []);

  const updateCurrentTimePosition = useCallback(() => {
    const now = new Date();
    const minutes = now.getHours() * 60 + now.getMinutes();
    const position = (minutes / (24 * 60)) * 100;
    setCurrentTimePosition(position);
  }, []);

  useEffect(() => {
    if (!isEditMode) {
      updateCurrentTimePosition();
      const interval = setInterval(updateCurrentTimePosition, 60000); // Update every minute
      return () => clearInterval(interval);
    }
  }, [isEditMode, updateCurrentTimePosition]);

  const playlistName = useMemo(() => {
    return params.name ? decodeURI(params.name).trim() : undefined;
  }, [params.name]);

  const getParamFromTime = useCallback((time: string) => {
    const [hour, minute] = time.split(':');
    return `h${hour}` + (minute === '00' ? '' : `m${minute}`);
  }, []);

  const getBlockTopPercentage = useCallback((startTime: string) => {
    const startMinutes = getTimeInMinutesFromTimeString(startTime);
    return (startMinutes / (24 * 60)) * 100;
  }, []);

  const urlTimeZone = useMemo(() => {
    return query['tz'] as string | undefined;
  }, [query]);

  const playlist = useMemo(() => {
    const list: Pick<ScheduleBlock, 'startTime' | 'station'>[] = [];
    Object.keys(query).forEach((key) => {
      if (key === 'tz') return;
      const startTime = getLocalTimeFromUrlKey(key, urlTimeZone);
      const station = getRadioStation(query[key] as string);
      if (startTime && station) {
        list.push({ startTime, station });
      }
    });
    list.sort((a, b) => a.startTime.localeCompare(b.startTime));
    return list.map((p, i) => {
      const endTime = list[i + 1]?.startTime || '23:59';
      const top = getBlockTopPercentage(p.startTime);
      return {
        ...p,
        endTime,
        top,
        height: getBlockTopPercentage(endTime) - top,
      } as ScheduleBlock;
    });
  }, [getBlockTopPercentage, query, urlTimeZone]);

  const playlistQueryString = useMemo(() => {
    const result = playlist.map((i) => getParamFromTime(i.startTime) + '=' + i.station?.id).join('&');
    const timeZone = getValidTimeZone(urlTimeZone);
    return result ? `?${result}&tz=${timeZone}` : '';
  }, [getParamFromTime, playlist, urlTimeZone]);

  const playlistUrl = useMemo(() => {
    return playlistName && playlistQueryString
      ? `${import.meta.env.VITE_BASE_URL}/playlist/${encodeURI(playlistName)}/${playlistQueryString}`
      : undefined;
  }, [playlistName, playlistQueryString]);

  const isPlaying = useMemo(() => {
    return playerState.value?.isPlaying && playlistUtil.isSameUrl(playerState.value?.pageLocation, playlistUrl);
  }, [playlistUrl]);

  useHead({
    url: playlistUrl,
    title: playlistName ? `${decodeURI(params.name).trim()}` : 'Playlist',
    type: 'music.playlist',
  });

  const getPlaylistUrlFromBlocks = useCallback(() => {
    if (!editName || !blocks.length) return '';
    const query = blocks
      .map((b) => {
        const time = getParamFromTime(b.startTime);
        const station = b.station?.id;
        return `${time}=${station}`;
      })
      .join('&');
    const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone; // Always set to the user's timezone when saving a playlist
    return `${import.meta.env.VITE_BASE_URL}/playlist/${encodeURI(editName)}/${query ? `?${query}&tz=${timeZone}` : ''}`;
  }, [blocks, editName, getParamFromTime, urlTimeZone]);

  useEffect(() => {
    if (!isDBLoaded.value) return;
    const previousState = { ...uiState.value };
    if (isEditMode) {
      uiState.value = { ...previousState, headerTitle: '' };
    } else {
      uiState.value = { ...previousState, headerTitle: playlistName || 'Playlist' };
    }
    return () => (uiState.value = { ...uiState.value, headerTitle: '' });
  }, [isDBLoaded.value, isEditMode, playlistName]);

  useEffect(() => {
    if (!(playlists.value || []).some((p) => !!p.url && playlistUtil.isSameUrl(p.url, playlistUrl))) {
      setIsEditMode(true);
      setEditName(playlistName || '');

      const newBlocks = structuredClone(playlist);
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
  }, [playlistUrl, setIsEditMode, setEditName, playlistName, playlist, getBlockTopPercentage, setBlocks]);

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
    const newUrl = getPlaylistUrlFromBlocks();
    playlists.value = [
      ...(playlists.value || []).filter((p) => !playlistUrl || p.url !== playlistUrl),
      {
        name: editName,
        url: newUrl,
        items: blocks.map((b) => ({ time: b.startTime, stationID: b.station?.id })),
        oldUrl: newUrl === window.location.href ? undefined : playlistUrl,
      },
    ] as Playlist[];
    route('/playlists');
    setIsEditMode(false);
  }, [editName, blocks, getPlaylistUrlFromBlocks, route, playlistUrl]);

  const handleCancelClick = useCallback(() => {
    if (isAddNew) route('/playlists');
    setIsEditMode(false);
  }, [isAddNew, route]);

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
        updatedBlocks[blockIndex - 1].height = 100 - (updatedBlocks[blockIndex - 1].top ?? 0);
      } else {
        updatedBlocks[blockIndex - 1].endTime = updatedBlocks[blockIndex].endTime;
        updatedBlocks[blockIndex - 1].height =
          getBlockTopPercentage(updatedBlocks[blockIndex].endTime) - (updatedBlocks[blockIndex - 1].top ?? 0);
      }

      updatedBlocks.splice(blockIndex, 1);
      setBlocks(updatedBlocks);
    },
    [blocks, getBlockTopPercentage],
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
          topBlock.height = getBlockTopPercentage(newTimeString) - (topBlock.top ?? 0);

          bottomBlock.startTime = newTimeString;
          bottomBlock.top = getBlockTopPercentage(newTimeString);
          bottomBlock.height = getBlockTopPercentage(bottomBlock.endTime) - bottomBlock.top;

          setBlocks(updatedBlocks);
        }
      });
    },
    [dragInfo, blocks, getBlockTopPercentage],
  );

  const handleDragEnd = useCallback(() => {
    containerRef.current?.classList.remove('is-dragging');
    setDragInfo(undefined);
  }, []);

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
    const splitPartHeight = newBlockTop - (lastBlock.top ?? 0);

    setBlocks([
      ...blocks.slice(0, -1),
      {
        ...lastBlock,
        endTime: splitPointTimeString,
        height: splitPartHeight,
      },
      {
        startTime: splitPointTimeString,
        endTime: lastBlock.endTime,
        top: newBlockTop,
        height: splitPartHeight,
      },
    ]);
  }, [blocks, getBlockTopPercentage]);

  const handleEditClick = useCallback(() => {
    setIsEditMode(true);
    setEditName(playlistName || '');

    const newBlocks = structuredClone(playlist);
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

  const handlePlayClick = useCallback(() => {
    playlistUtil.playPlaylistByUrl(playlistUrl, true);
  }, [playlistUrl]);

  return {
    playlistName: playlistName || 'Playlist',
    playlist,
    blocks,
    isEditMode,
    editName,
    containerRef,
    currentTimePosition,
    showNightSchedule,
    isPlaying,
    handleNameInput,
    handleSaveClick,
    handleCancelClick,
    handleStationChange,
    handleDeleteBlock,
    handleDragStart,
    handleAddBlock,
    handleEditClick,
    handlePlayClick,
    toggleNightSchedule,
  };
};
