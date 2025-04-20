import { Bookmark, Play, Trash2 } from 'lucide-preact';
import { Badge } from '~/components/ui/badge';
import { useRadioBrowser } from '~/hooks/useRadioBrowser';
import { cn } from '~/lib/utils';
import { playerState } from '~/store/signals/player';
import {
  addRadioBrowserStation,
  addRecentlyVisitedRadioStation,
  deleteBrowserStation,
  followedRadioStationIDs,
  getRadioStationLanguage,
  RADIO_BROWSER_PARAM_PREFIX,
} from '~/store/signals/radio';
import { RadioStation } from '~/store/types';
import { Button } from './ui/button';

interface Props {
  station: RadioStation;
  size?: 'default' | 'large';
  hasDeleteHidden?: boolean;
}

export const RadioStationCard = ({ station, size = 'default', hasDeleteHidden = false }: Props) => {
  const { setStationClick } = useRadioBrowser();

  const onClickPlay = (e: { preventDefault: () => void; stopPropagation: () => void }) => {
    e.preventDefault();
    e.stopPropagation();
    addRadioBrowserStation(station);
    addRecentlyVisitedRadioStation(station.id);
    playerState.value = {
      playType: 'radio',
      isPlaying: true,
      contentID: station.id,
      title: station.name,
      description: '',
      imageUrl: station.logosource,
      streams: station.streams,
      pageLocation: `/radio-station/${station.id}`,
    };
    if (station.stationuuid) {
      setStationClick(station.stationuuid);
    }
  };

  const handleDeleteStation = (e: { preventDefault: () => void; stopPropagation: () => void }) => {
    e.preventDefault();
    e.stopPropagation();
    if (
      station.id.startsWith(RADIO_BROWSER_PARAM_PREFIX) &&
      confirm(
        `This is a locally saved station (from RadioBrowser).\n\nAre you sure you want to delete "${station.name}"?`,
      )
    ) {
      deleteBrowserStation(station.id);
    }
  };

  const RadioFlag = () => {
    const stationLanguage = getRadioStationLanguage(station);
    if (!stationLanguage?.flag) return null;

    return (
      <Badge title={stationLanguage.name} class="uppercase" variant="secondary">
        {stationLanguage.flag}
      </Badge>
    );
  };

  const isFollowing = followedRadioStationIDs.value.includes(station.id);

  if (size === 'large') {
    return (
      <a
        class="block w-full sm:min-w-72 h-28 group"
        href={`/radio-station/${station.id}`}
        title={isFollowing ? `${station.name} (following)` : station.name}
      >
        <div class="w-full h-full relative overflow-hidden rounded-xl border bg-card shadow-lg hover:shadow-xl transition-all flex">
          <div class="w-28 h-full shrink-0 opacity-80 group-hover:opacity-100 relative overflow-hidden">
            <div
              class="absolute inset-0 w-full h-full bg-cover bg-center"
              style={{
                backgroundImage: `url(${station.logosource})`,
                filter: 'blur(1.5rem)',
                opacity: 0.3,
                transform: 'scale(2)',
              }}
            />
            <div class="relative h-full flex items-center justify-center">
              <img src={station.logosource} alt={`${station.name} logo`} class="w-16 h-16 rounded-full" />
            </div>
            <button
              onClick={onClickPlay}
              class="absolute inset-0 bg-black/0 hover:bg-black/40 duration-500 flex items-center justify-center opacity-0 hover:opacity-100 transition-[background-color,opacity]"
              title={`Play ${station.name}`}
            >
              <Play size={36} class="text-white" />
            </button>
          </div>
          <div class="flex-1 sm:min-w-[288px] px-4 pt-2">
            <h3
              class={cn(
                'font-bold text-foreground group-hover:text-primary text-lg transition-colors duration-500 line-clamp-1',
                !hasDeleteHidden &&
                  station.id.startsWith(RADIO_BROWSER_PARAM_PREFIX) &&
                  'flex items-top justify-between',
              )}
            >
              {station.name}
              {!hasDeleteHidden && station.id.startsWith(RADIO_BROWSER_PARAM_PREFIX) && (
                <Button
                  variant="outline"
                  styleSize="sm"
                  onClick={handleDeleteStation}
                  title="Delete block"
                  class="shrink-0 ml-2 mt-2"
                >
                  <Trash2 class="w-4 h-4" />
                </Button>
              )}
            </h3>
            <div class="flex flex-wrap gap-2 mt-2">
              <RadioFlag />
              {station.genres?.map((genre) => (
                <Badge key={genre} variant="outline">
                  {genre}
                </Badge>
              ))}
            </div>
          </div>
          {followedRadioStationIDs.value.includes(station.id) && (
            <Bookmark
              title={`Following ${station.name}`}
              class={`h-6 w-6 absolute -top-0.5 right-3 fill-stone-300 stroke-stone-300 dark:fill-stone-700 dark:stroke-stone-700`}
            />
          )}
        </div>
      </a>
    );
  }

  return (
    <a class="block w-28 h-28 group" href={`/radio-station/${station.id}`} title={station.name}>
      <div class="w-full h-full relative overflow-hidden rounded-xl border bg-card shadow-lg hover:shadow-xl transition-all">
        <div
          class="absolute inset-0 w-full h-full bg-cover bg-center"
          style={{
            backgroundImage: `url(${station.logosource})`,
            filter: 'blur(1.5rem)',
            opacity: 0.3,
            transform: 'scale(2)',
          }}
        />
        <div class="relative h-full flex flex-col items-center pt-3">
          <img src={station.logosource} alt={`${station.name} logo`} class="w-14 h-14 rounded-full" />
          <button
            onClick={onClickPlay}
            class="absolute inset-0 bg-black/0 hover:bg-black/40 duration-500 flex items-center justify-center opacity-0 hover:opacity-100 transition-[background-color,opacity]"
            title={`Play ${station.name}`}
          >
            <Play size={36} class="text-white -mt-6" />
          </button>
          <div class="absolute bottom-0 left-0 right-0 bg-white dark:bg-stone-700 py-1 px-2">
            <span class="text-center font-bold text-foreground group-hover:text-primary text-sm truncate w-full block transition-colors">
              {station.name}
            </span>
          </div>
        </div>
      </div>
    </a>
  );
};
