import { useCallback, useMemo } from 'preact/hooks';
import { useHead } from '~/hooks/useHead';
import { playlists } from '~/store/signals/playlist';
import { getRadioStation } from '~/store/signals/radio';
import { PlaylistItem, RadioStation } from '~/store/types';

interface PlaylistData {
  url: string;
  name: string;
  stations: RadioStation[];
  stationPercentages: StationPercentage[];
}
interface StationPercentage {
  stationID: string;
  logo: string;
  name: string;
  startTime: string;
  endTime: string;
  percentage: number;
  startPercentage: number;
  isActive: boolean;
}

export const usePlaylists = () => {
  const startHour = 6;
  const endHour = 21;

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
        let itemHour = itemTime.getHours();

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
    [playlists.value, currentTimePercentage],
  );

  const playlistsData = useMemo((): PlaylistData[] => {
    return (playlists.value || []).map((p) => {
      const stations = [...new Set(p.items.map((i) => i.stationID))]
        .map((id) => getRadioStation(id))
        .filter(Boolean) as RadioStation[];
      return {
        url: p.url ? p.url.replace(import.meta.env.VITE_BASE_URL, '') : '',
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

  return {
    playlistsData,
    currentTimePercentage,
    handleDeletePlaylist,
  };
};
