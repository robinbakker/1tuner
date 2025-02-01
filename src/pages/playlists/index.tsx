import { Badge } from '~/components/ui/badge';
import { usePlaylists } from './usePlaylists';
import { Play } from 'lucide-preact';

export const PlaylistsPage = () => {
  const { playlistsData } = usePlaylists();
  console.log(playlistsData);

  return (
    <div class="container mx-auto px-8 py-6">
      <h1 class="text-3xl font-bold mb-6">Playlists</h1>
      <section class="mb-8 relative">
        {playlistsData.map((playlist) => (
          <div
            key={playlist.url}
            class="mb-4 rounded-xl border bg-card shadow-lg hover:shadow-xl transition-all flex flex-col"
          >
            <div className="px-6 py-4">
            <div class="w-28 h-full shrink-0 opacity-80 group-hover:opacity-100 relative overflow-hidden">
            <div
              class="absolute inset-0 w-full h-full bg-cover bg-center"
              style={{
                background: `#f90`,
                filter: 'blur(1.5rem)',
                opacity: 0.3,
                transform: 'scale(2)',
              }}
            />
            <div class="relative h-full flex items-center justify-center">
              </div>
            <button
              onClick={() => console.log('sa')}
              class="absolute inset-0 bg-black/0 hover:bg-black/40 duration-500 flex items-center justify-center opacity-0 hover:opacity-100 transition-[background-color,opacity]"
              title={`Play`}
            >
              <Play size={36} class="text-white" />
            </button>
          </div>
            <h2 class="text-xl font-semibold">
              <a href={playlist.url}>{playlist.name}</a>
            </h2>
            <ul className="flex flex-row gap-2 mt-2 mb-3">
              {playlist.stations.map((s) => (
                <li>
                  <Badge key={s.id} variant="outline">
                    {s.name}
                  </Badge>
                </li>
              ))}
            </ul></div>
            <div className="flex rounded-bl-lg rounded-br-lg flex-row w-full h-3 border border-stone-300 dark:border-stone-600 overflow-hidden">
              {playlist.stationPercentages.map((segment) => (
                <div
                  key={`${segment.stationID}-${segment.hour}`}
                  title={segment.name}
                  className={'relative filter overflow-hidden h-full border-r-2 border-stone-100 dark:border-stone-100 last:border-r-0'}
                  style={`width: ${segment.percentage}%;`}
                >
                  <div
                    className="absolute inset-0 w-full h-full bg-cover bg-center"
                    style={`background-image: url(${segment.logo}); filter: blur(2rem); opacity: 1;`}
                  />
                  <div
                    className="absolute inset-0 w-full h-full bg-cover bg-center"
                    style={`background-image: url(${segment.logo}); filter: blur(2rem); opacity: 1;`}
                  />
                  <div
                    className="absolute inset-0 w-full h-full bg-cover bg-center"
                    style={`background-image: url(${segment.logo}); filter: blur(2rem); opacity: 1;`}
                  />
                  <div
                    className="absolute inset-0 w-full h-full bg-cover bg-center"
                    style={`background-image: url(${segment.logo}); filter: blur(2rem); opacity: 1;`}
                  />
                  <div
                    className="absolute inset-0 w-full h-full bg-cover bg-center"
                    style={`background-image: url(${segment.logo}); filter: blur(2rem); opacity: 1;`}
                  />
                  <div
                    className="absolute inset-0 w-full h-full bg-cover bg-center"
                    style={`background-image: url(${segment.logo}); filter: blur(2rem); opacity: 1;`}
                  />
                </div>
              ))}
            </div>
          </div>
        ))}
      </section>
    </div>
  );
};
