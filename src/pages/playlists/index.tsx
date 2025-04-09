import { Play, Plus, Trash2 } from 'lucide-preact';
import { Badge } from '~/components/ui/badge';
import { Button } from '~/components/ui/button';
import { DropdownList } from '~/components/ui/dropdown-list';
import { styleClass } from '~/lib/styleClass';
import { getColorString } from '~/lib/utils';
import { playlistRules } from '~/store/signals/playlist';
import { followedRadioStationIDs, getRadioStation, radioStations } from '~/store/signals/radio';
import { RuleDestination } from './types';
import { usePlaylists } from './usePlaylists';

export const PlaylistsPage = () => {
  const {
    playlistsData,
    currentTimePercentage,
    ruleDestinationValue,
    handlePlay,
    handleDeletePlaylist,
    handleRuleDestinationChange,
    handleRuleStationChange,
    handleRulePlaylistChange,
  } = usePlaylists();

  return (
    <div class="container mx-auto px-8 py-6">
      <h1 class="text-3xl font-bold mb-6">Playlists</h1>
      <section class="mb-8 relative">
        <h2 class="text-xl font-semibold">Rules</h2>
        <div>
          When a podcast episode is finished, play{' '}
          <select
            title="Destination source"
            value={ruleDestinationValue}
            onChange={handleRuleDestinationChange}
            class={`${styleClass.selectSmall} inline-block`}
          >
            <option value={RuleDestination.Nothing}>nothing</option>
            <option value={RuleDestination.RadioStation}>radio station</option>
            <option value={RuleDestination.Playlist} disabled={!playlistsData.length}>
              playlist
            </option>
          </select>
          {+ruleDestinationValue === +RuleDestination.RadioStation && (
            <DropdownList
              id={`button-station`}
              class="ml-2 inline-block"
              options={[...radioStations.value]
                .sort(
                  (a, b) =>
                    +followedRadioStationIDs.value.includes(b.id) - +followedRadioStationIDs.value.includes(a.id),
                )
                .map((s) => ({ label: s.name, value: s.id }))}
              value={playlistRules.value?.[0]?.stationID}
              onChangeOption={(value) => handleRuleStationChange(value)}
              useNativePopover={true}
              trigger={
                <button type="button" popoverTarget={`button-station-popover`} title="Select station...">
                  {playlistRules.value?.[0]?.stationID ? (
                    <span class="text-sm text-stone-600 underline">
                      {getRadioStation(playlistRules.value?.[0]?.stationID)?.name}
                    </span>
                  ) : (
                    <span class="text-sm text-stone-600 underline">Select station...</span>
                  )}
                </button>
              }
            />
          )}
          {+ruleDestinationValue === +RuleDestination.Playlist && (
            <DropdownList
              id={`button-playlist`}
              class="ml-2 inline-block"
              options={[...playlistsData].map((s) => ({ label: s.name, value: s.url }))}
              value={playlistRules.value?.[0]?.playlistUrl}
              onChangeOption={(value) => handleRulePlaylistChange(value)}
              useNativePopover={true}
              trigger={
                <button type="button" popoverTarget={`button-playlist-popover`} title="Select playlist...">
                  {playlistRules.value?.[0]?.playlistUrl ? (
                    <span class="text-sm text-stone-600 underline">
                      {playlistsData.find((pd) => pd.url === playlistRules.value?.[0]?.playlistUrl)?.name}
                    </span>
                  ) : (
                    <span class="text-sm text-stone-600 underline">Select playlist...</span>
                  )}
                </button>
              }
            />
          )}
        </div>
      </section>
      <hr class="mb-8" />
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
                  onClick={() => handlePlay(playlist)}
                  class="absolute inset-0 bg-black/0 hover:bg-black/40 duration-500 flex items-center justify-center opacity-0 hover:opacity-100 transition-[background-color,opacity]"
                  title={`Play`}
                >
                  <Play size={36} class="text-white" />
                </button>
              </div>
              <div class="flex-1 min-w-0">
                <h2 class="text-xl font-semibold flex items-center">
                  <a href={playlist.url} class="truncate block min-w-0 flex-1">
                    {playlist.name}
                  </a>
                  <Button
                    variant="outline"
                    styleSize="sm"
                    onClick={() => handleDeletePlaylist(playlist)}
                    title="Delete block"
                    class="shrink-0 ml-2"
                  >
                    <Trash2 class="w-4 h-4" />
                  </Button>
                </h2>
                <ul class="flex flex-row flex-wrap gap-2 mt-2 mb-3">
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
                  class="absolute top-0 w-0 h-0 z-10 -translate-x-1/2 border-l-4 border-r-4 border-t-[6px] border-transparent border-t-stone-500"
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
