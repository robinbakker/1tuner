import { ChangeEvent } from 'preact/compat';
import { useCallback, useMemo, useState } from 'preact/hooks';
import { useHead } from '~/hooks/useHead';
import { playlistUtil } from '~/lib/playlistUtil';
import { playlistRules, playlists } from '~/store/signals/playlist';
import { getRadioStation } from '~/store/signals/radio';
import { PlaylistItem, PlaylistRuleType, RadioStation } from '~/store/types';
import { PlaylistData, RuleDestination, StationPercentage } from './types';

export const usePlaylists = () => {
  const startHour = 6;
  const endHour = 21;
  const [ruleDestinationValue, setRuleDestinationValue] = useState<RuleDestination>(
    playlistUtil.ruleTypeToDestination(playlistRules.value?.[0]?.ruleType),
  );

  useHead({
    title: 'Playlists',
    url: `${import.meta.env.VITE_BASE_URL}/podcasts`,
  });

  const currentTimePercentage = useMemo(() => {
    const now = new Date();
    const hour = now.getHours();
    const minute = now.getMinutes();
    if (hour < startHour || hour >= endHour) return null;

    const totalMinutes = (hour - startHour) * 60 + minute;
    const totalPeriodMinutes = (endHour - startHour) * 60;
    return (totalMinutes / totalPeriodMinutes) * 100;
  }, []);

  const getPercentagePerStation = useCallback(
    (items: PlaylistItem[], stations: RadioStation[]) => {
      const totalMinutes = (endHour - startHour) * 60;
      const plItems = [...items].sort((a, b) => a.time.localeCompare(b.time));
      const timeRanges: { stationID: string; start: Date; end: Date }[] = [];

      plItems.forEach((item, index) => {
        let itemTime = new Date(`1970-01-01T${item.time}`);
        const itemHour = itemTime.getHours();

        let endTime: Date;
        const nextItem = plItems[index + 1];

        if (itemHour < startHour || itemHour >= endHour) {
          if (nextItem) {
            const nextItemTime = new Date(`1970-01-01T${nextItem.time}`);
            const nextItemHour = nextItemTime.getHours();
            if (nextItemHour > startHour) {
              itemTime = new Date(`1970-01-01T${startHour.toString().padStart(2, '0')}:00`);
              endTime = new Date(`1970-01-01T${nextItem.time}`);
            } else {
              return;
            }
          } else {
            return;
          }
        } else if (nextItem) {
          endTime = new Date(`1970-01-01T${nextItem.time}`);
          if (endTime.getHours() >= endHour) {
            endTime = new Date(`1970-01-01T${endHour}:00`);
          }
        } else {
          endTime = new Date(`1970-01-01T${endHour}:00`);
        }

        if (itemTime < endTime) {
          timeRanges.push({
            stationID: item.stationID,
            start: itemTime,
            end: endTime,
          });
        }
      });

      let currentPercentage = 0;
      const stationPercentages: StationPercentage[] = timeRanges.map((range) => {
        const duration = (range.end.getTime() - range.start.getTime()) / (1000 * 60); // in minutes
        const percentage = (duration / totalMinutes) * 100;
        const startPercentage = currentPercentage;
        currentPercentage += percentage;
        const station = stations.find((s) => s.id === range.stationID);
        const isActive =
          !!currentTimePercentage &&
          currentTimePercentage >= startPercentage &&
          currentTimePercentage < startPercentage + percentage;

        return {
          stationID: range.stationID,
          percentage,
          startPercentage,
          startTime: range.start.toTimeString().substring(0, 5),
          endTime: range.end.toTimeString().substring(0, 5),
          name: station?.name || range.stationID,
          logo: station?.logosource,
          isActive,
        } as StationPercentage;
      });

      return stationPercentages;
    },
    [currentTimePercentage],
  );

  const playlistsData = useMemo((): PlaylistData[] => {
    return (playlists.value || []).map((p) => {
      const stations = [...new Set((p.items ?? []).map((i) => i.stationID))]
        .map((id) => getRadioStation(id))
        .filter(Boolean) as RadioStation[];
      let url = p.url ? p.url.replace(import.meta.env.VITE_BASE_URL, '') : '';
      if (!url.startsWith('/')) url = `/${url}`;
      if (url.startsWith('//')) url = url.substring(1);
      return {
        url,
        name: p.name,
        stations,
        stationPercentages: getPercentagePerStation(p.items, stations),
      };
    });
  }, [playlists.value, getPercentagePerStation]);

  const handleDeletePlaylist = (playlist: PlaylistData) => {
    if (confirm(`Are you sure you want to delete "${playlist.name}"?`)) {
      playlists.value = (playlists.value || []).filter(
        (p) => p.url && p.url.replace(import.meta.env.VITE_BASE_URL, '') !== playlist.url,
      );
    }
  };

  const handlePlay = (playlist: PlaylistData) => {
    playlistUtil.playPlaylistByUrl(playlist.url, true);
  };

  const handleRuleDestinationChange = (e: ChangeEvent<HTMLSelectElement>) => {
    const newValue = e.currentTarget.value as unknown as RuleDestination;
    setRuleDestinationValue(newValue);
    if (+newValue === +RuleDestination.Nothing) {
      playlistRules.value = [];
    }
  };

  const handleRuleStationChange = (value: string) => {
    playlistRules.value = [{ ruleType: PlaylistRuleType.podcastToStation, stationID: value }];
  };

  const handleRulePlaylistChange = (value: string) => {
    playlistRules.value = [{ ruleType: PlaylistRuleType.podcastToPlaylist, playlistUrl: value }];
  };

  return {
    playlistsData,
    currentTimePercentage,
    ruleDestinationValue,
    handlePlay,
    handleDeletePlaylist,
    handleRuleDestinationChange,
    handleRuleStationChange,
    handleRulePlaylistChange,
  };
};
