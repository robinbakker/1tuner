import { Play } from 'lucide-preact';
import { Badge } from '~/components/ui/badge';
import { setPlayerState } from '~/store/signals/player';
import { RadioStation } from '~/store/types';

interface Props {
  station: RadioStation;
  size?: 'default' | 'large';
}

export const RadioStationCard = ({ station, size = 'default' }: Props) => {
  const onClickPlay = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setPlayerState({
      isPlaying: true,
      contentID: station.id,
      title: station.name,
      description: '',
      imageUrl: station.logosource,
      streams: station.streams,
      pageLocation: `/radio-station/${station.id}`,
    });
  };

  if (size === 'large') {
    return (
      <a class="block w-full sm:w-72 h-28 group" href={`/radio-station/${station.id}`} title={station.name}>
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
              class="absolute inset-0 bg-black/0 hover:bg-black/40 duration-700 flex items-center justify-center opacity-0 hover:opacity-100 transition-[background-color,opacity]"
              title="Play station"
            >
              <Play size={36} class="text-white" />
            </button>
          </div>

          <div class="flex-1 sm:w-[288px] p-4">
            <h3 class="font-bold text-gray-500 group-hover:text-primary text-lg transition-colors duration-500 line-clamp-1">
              {station.name}
            </h3>
            <div class="flex flex-wrap gap-2 mt-2">
              {station.language && (
                <Badge className="uppercase" variant="secondary">
                  {station.language}
                </Badge>
              )}
              {station.genres?.map((genre) => (
                <Badge key={genre} variant="outline">
                  {genre}
                </Badge>
              ))}
            </div>
          </div>
        </div>
      </a>
    );
  }

  return (
    <a class="block w-28 h-28 group" href={`/radio-station/${station.id}`} title={station.name}>
      <div class="w-full h-full relative overflow-hidden rounded-lg border bg-card shadow-lg hover:shadow-xl transition-all">
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
          <div class="absolute bottom-0 left-0 right-0 bg-white py-1 px-2">
            <span class="text-center font-bold text-gray-500 group-hover:text-primary text-sm truncate w-full block transition-colors">
              {station.name}
            </span>
          </div>
        </div>
      </div>
    </a>
  );
};
