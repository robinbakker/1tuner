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
  hour: number;
  percentage: number;
  startPercentage: number;
}

export const usePlaylists = () => {
  useHead({
    title: 'Playlists',
    url: `${import.meta.env.VITE_BASE_URL}/podcasts`,
  });

  const getPercentagePerStation = useCallback(
    (items: PlaylistItem[], stations: RadioStation[]) => {
      const startHour = 6;
      const endHour = 21;
      const totalMinutes = (endHour - startHour) * 60;

      // Sort items by time
      const plItems = [...items].sort((a, b) => a.time.localeCompare(b.time));

      // Filter items within time range and pair them with next item to calculate duration
      const timeRanges: { stationID: string; start: Date; end: Date }[] = [];

      plItems.forEach((item, index) => {
        const itemTime = new Date(`1970-01-01T${item.time}`);
        let itemHour = itemTime.getHours();

        let endTime: Date;
        const nextItem = plItems[index + 1];

        // Skip if item is outside our time range
        if (itemHour < startHour || itemHour >= endHour) {
          if (nextItem) {
            const nextItemTime = new Date(`1970-01-01T${nextItem.time}`);
            const nextItemHour = nextItemTime.getHours();
            if (nextItemHour > startHour) {
              itemHour = startHour;
              endTime = new Date(`1970-01-01T${nextItem.time}`);
            }
          }
          return;
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

      // Calculate percentages
      let currentPercentage = 0;
      const stationPercentages: StationPercentage[] = timeRanges.map((range) => {
        const duration = (range.end.getTime() - range.start.getTime()) / (1000 * 60); // in minutes
        const percentage = (duration / totalMinutes) * 100;
        const startPercentage = currentPercentage;
        currentPercentage += percentage;
        const station = stations.find((s) => s.id === range.stationID);

        return {
          stationID: range.stationID,
          percentage,
          startPercentage,
          hour: range.start.getHours(),
          name: station?.name || range.stationID,
          logo: station?.logosource,
        } as StationPercentage;
      });

      return stationPercentages;
    },
    [playlists.value],
  );

  const playlistsData = useMemo((): PlaylistData[] => {
    return (playlists.value || []).map((p) => {
      const stations = [...new Set(p.items.map((i) => i.stationID))]
        .map((id) => getRadioStation(id))
        .filter(Boolean) as RadioStation[];
      return {
        url: p.url.replace(import.meta.env.VITE_BASE_URL, ''),
        name: p.name,
        stations,
        stationPercentages: getPercentagePerStation(p.items, stations),
      };
    });
  }, [playlists.value]);

  return {
    playlistsData,
  };
};
