import { Clock, Plus, Trash2 } from 'lucide-preact';
import { Button } from '~/components/ui/button';
import { DropdownList } from '~/components/ui/dropdown-list';
import { Input } from '~/components/ui/input';
import { cn } from '~/lib/utils';
import { radioStations } from '~/store/signals/radio';
import { usePlaylist } from './usePlaylist';

export const PlaylistPage = () => {
  const {
    playlistName,
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
    handleDragEnd,
    handleDrag,
    handleAddBlock,
  } = usePlaylist();

  return (
    <div class="container mx-auto px-8 py-6">
      <h1 class="text-3xl font-bold mb-6">{`${isEditMode ? 'Edit' : ''} ${playlistName}`}</h1>
      {!isEditMode ? (
        <section class="mb-8 relative">
          {playlist.map((i) => (
            <div key={i.time} class="mb-4">
              <time>{i.time}</time> {i.station.name}
            </div>
          ))}
        </section>
      ) : (
        <>
          <Input type="text" placeholder={'Playlist name'} class="mb-4" value={editName} onInput={handleNameInput} />
          <div class="w-full max-w-md mx-auto p-4 h-[720px] flex flex-col">
            <div ref={containerRef} class="relative h-full border rounded-lg">
              {blocks.map((block, index) => (
                <div
                  key={`${block.startTime}-${block.station?.id}`}
                  class="absolute w-full px-4 overflow-hidden"
                  style={{
                    top: `${block.top}%`,
                    height: `${block.height}%`,
                  }}
                >
                  {block.station && (
                    <div class="absolute -inset-2 -top-40 md:-top-96 z-0 pointer-events-none">
                      <img src={block.station.logosource} class="w-full filter blur-2xl opacity-50" />
                    </div>
                  )}
                  <div
                    class={cn(
                      'relative h-full flex flex-col justify-start rounded',
                      block.height > 10 ? 'mt-2' : 'mt-0',
                    )}
                  >
                    <div class="flex items-center justify-between mb-2">
                      <div class="flex items-center gap-2">
                        <Clock class="w-4 h-4 text-stone-500" />
                        <span class="text-sm text-stone-600">
                          {block.startTime} - {block.endTime}
                        </span>
                      </div>
                      {blocks.length > 1 && (
                        <button
                          onClick={() => handleDeleteBlock(index)}
                          class="p-1 text-gray-500 hover:text-red-500 transition-colors"
                          title="Delete block"
                        >
                          <Trash2 class="w-4 h-4" />
                        </button>
                      )}
                    </div>
                    <DropdownList
                      id={`button-${block.startTime}-${block.station?.id}`}
                      class="flex items-center justify-center gap-2"
                      options={radioStations.value.map((s) => ({ label: s.name, value: s.id }))}
                      value={block.station?.id}
                      onChangeOption={(value) => handleStationChange(index, value)}
                      useNativePopover={true}
                      trigger={
                        <button
                          type="button"
                          popoverTarget={`button-${block.startTime}-${block.station?.id}-popover`}
                          title="Select station..."
                        >
                          {block.station?.logosource ? (
                            <img
                              alt={block.station.name}
                              src={block.station.logosource}
                              data-test={block.height}
                              class={cn('rounded-full', block.height > 15 ? 'w-10 h-10' : 'w-6 h-6')}
                            />
                          ) : (
                            <span class="text-sm text-stone-600">Select station...</span>
                          )}
                        </button>
                      }
                    />
                    {/* <select
                      value={block.station?.id}
                      onChange={(e) => handleStationChange(index, e.currentTarget.value)}
                      class="w-full p-2 border rounded"
                    >
                      <option value="" disabled>
                        Select station...
                      </option>
                      {radioStations.value.map((station) => (
                        <option key={station.id} value={station.id}>
                          {station.name}
                        </option>
                      ))}
                    </select> */}
                  </div>

                  {index < blocks.length - 1 && (
                    <div
                      class="absolute bottom-0 left-0 w-full h-2 bg-stone-300 cursor-ns-resize hover:bg-primary transition-colors"
                      draggable={true}
                      onDragStart={(e) => handleDragStart(e, index)}
                      onDrag={handleDrag}
                      onDragEnd={handleDragEnd}
                    />
                  )}
                </div>
              ))}
            </div>
          </div>
          <Button onClick={handleAddBlock}>
            <Plus class="w-5 h-5 -ml-2 mr-1" /> Add
          </Button>
          <div>
            <Button variant={'secondary'} onClick={handleCancelClick}>
              Cancel
            </Button>{' '}
            <Button onClick={handleSaveClick}>Save</Button>
          </div>
        </>
      )}
    </div>
  );
};
