import { Play, Plus } from 'lucide-preact';
import { Badge } from '~/components/ui/badge';
import { Button } from '~/components/ui/button';
import { getColorString } from '~/lib/utils';
import { usePlaylists } from './usePlaylists';

export const PlaylistsPage = () => {
  const { playlistsData, currentTimePercentage } = usePlaylists();

  return (
    <div class="container mx-auto px-8 py-6">
      <h1 class="text-3xl font-bold mb-6">Playlists</h1>
      <div class="mb-6">
        <Button asChild>
          <a href="/playlist">
            <Plus class="w-5 h-5 -ml-2 mr-1" /> Add playlist
          </a>
        </Button>
      </div>
      <section class="mb-8 relative">
        {playlistsData.map((playlist) => (
          <div
            key={playlist.url}
            class="mb-4 rounded-xl border bg-card shadow-lg hover:shadow-xl transition-all flex flex-col"
          >
            <div class="p-4 pb-0 flex items-start space-x-4">
              <div
                class="rounded-md shrink-0 p-3 relative overflow-hidden"
                style={{ backgroundColor: getColorString(playlist.name) }}
              >
                <div class="h-full text-white flex items-center justify-center">
                  <svg
                    class="h-10 w-10 text-current group-hover:text-primary transition-colors duration-200"
                    xmlns="http://www.w3.org/2000/svg"
                    style="isolation:isolate"
                    stroke="currentColor"
                    viewBox="0 0 42 42"
                  >
                    <defs>
                      <clipPath id="cpPlaylist">
                        <path d="M0 0h42v42H0z" />
                      </clipPath>
                    </defs>
                    <g
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      stroke-miterlimit="3"
                      stroke-width="2"
                      clip-path="url(#a)"
                    >
                      <path
                        d="M8.572 33.021h28.356M8.572 23.021h28.356M17.928 13.021h19"
                        vector-effect="non-scaling-stroke"
                      />
                      <path fill="none" d="M5.072 17.062V8.979l7 4.042z" vector-effect="non-scaling-stroke" />
                    </g>
                  </svg>
                </div>
                <button
                  onClick={() => console.log('sa')}
                  class="absolute inset-0 bg-black/0 hover:bg-black/40 duration-500 flex items-center justify-center opacity-0 hover:opacity-100 transition-[background-color,opacity]"
                  title={`Play`}
                >
                  <Play size={36} class="text-white" />
                </button>
              </div>
              <div class="flex-1">
                <h2 class="text-xl font-semibold">
                  <a href={playlist.url}>{playlist.name}</a>
                </h2>
                <ul class="flex flex-row gap-2 mt-2 mb-3">
                  {playlist.stations.map((s) => (
                    <li>
                      <Badge
                        key={s.id}
                        variant={
                          playlist.stationPercentages.some((p) => p.stationID === s.id && p.isActive)
                            ? 'secondary'
                            : 'outline'
                        }
                      >
                        {s.name}
                      </Badge>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
            <div class="flex rounded-bl-lg rounded-br-lg flex-row w-full h-5 pt-2 overflow-hidden relative">
              {!!currentTimePercentage && (
                <div
                  class="absolute top-0 w-0 h-0 z-10 -translate-x-1/2 border-l-4 border-r-4 border-t-[6px] border-transparent border-t-primary"
                  style={{ left: `${currentTimePercentage}%` }}
                />
              )}
              {playlist.stationPercentages.map((segment) => (
                <div
                  key={`${segment.stationID}-${segment.startTime}`}
                  title={`${segment.startTime}-${segment.endTime} ${segment.name}`}
                  class={
                    'relative filter saturate-200 overflow-hidden h-full border-r-2 border-stone-100 dark:border-stone-100 last:border-r-0'
                  }
                  style={`width: ${segment.percentage}%;`}
                >
                  {[...new Array(10)].map((_, i) => (
                    <div
                      key={`${segment.stationID}-${segment.startTime}-segment-${i}`}
                      class="absolute inset-0 w-full h-full bg-contain bg-center filter blur-lg scale-150"
                      style={`background-image: url(${segment.logo});`}
                    />
                  ))}
                </div>
              ))}
            </div>
          </div>
        ))}
      </section>
    </div>
  );
};
