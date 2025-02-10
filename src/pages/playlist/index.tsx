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
    handleAddBlock,
    handleEditClick,
  } = usePlaylist();

  return (
    <div class="container mx-auto px-8 py-6">
      <div class="flex justify-between">
        <h1 class="text-3xl font-bold mb-6">{`${isEditMode ? 'Edit' : ''} ${playlistName}`}</h1>
        {isEditMode ? (
          <div>
            <Button class="mr-2" variant={'secondary'} onClick={handleCancelClick}>
              Cancel
            </Button>{' '}
            <Button onClick={handleSaveClick}>Save</Button>
          </div>
        ) : (
          <Button onClick={handleEditClick}>Edit</Button>
        )}
      </div>
      {!isEditMode ? (
        <section class="mb-8 relative">
          <div class="w-full flex flex-col h-[720px]">
            {playlist.map((i) => (
              <div
                key={i.startTime}
                class="relative overflow-hidden border-b"
                style={{
                  height: `${i.height}%`,
                }}
              >
                <div class="absolute -inset-2 -top-40 md:-top-96 z-0 pointer-events-none">
                  <img src={i.station?.logosource} class="w-full filter blur-3xl opacity-50" />
                </div>
                <div class={'relative z-10 flex flex-col items-center justify-between p-4'}>
                  <div class="w-full flex items-center gap-2">
                    <Clock class="w-4 h-4 text-stone-500" />
                    <span class="text-sm text-stone-600 dark:text-stone-300">
                      {i.startTime} - {i.endTime} {i.station?.name}
                    </span>
                  </div>
                  <img
                    alt={i.station?.name}
                    src={i.station?.logosource}
                    data-test={i.height}
                    class={cn('rounded-full', i.height > 15 ? 'w-16 h-16' : i.height > 7 ? 'w-10 h-10' : 'w-5 h-5')}
                  />
                </div>
              </div>
            ))}
          </div>
        </section>
      ) : (
        <>
          <Input
            maxLength={80}
            type="text"
            placeholder={'Playlist name'}
            class="mb-4 w-full max-w-md mx-auto"
            value={editName}
            onInput={handleNameInput}
            autoFocus
          />
          <div class={'w-full max-w-md mx-auto flex flex-col ' + (blocks.length < 2 ? 'h-[300px]' : 'h-[720px]')}>
            <div ref={containerRef} class="relative h-full border rounded-lg select-none">
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
                    <div class="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 -mt-1 z-10">
                      <DropdownList
                        id={`button-${block.startTime}-${block.station?.id}`}
                        class="flex items-center justify-center"
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
                                class={cn(
                                  'rounded-full transition-all',
                                  block.height > 15 ? 'w-16 h-16' : block.height > 7 ? 'w-10 h-10' : 'w-5 h-5',
                                )}
                              />
                            ) : (
                              <span class="text-sm text-stone-600 underline">Select station...</span>
                            )}
                          </button>
                        }
                      />
                    </div>
                    <div class="flex items-center justify-between mb-2">
                      <div class="flex items-center gap-2">
                        <Clock class="w-4 h-4 text-stone-500" />
                        <span class="text-sm text-stone-600 dark:text-stone-300">
                          {block.startTime} - {block.endTime}
                        </span>
                      </div>
                      {blocks.length > 1 && (
                        <Button
                          variant="outline"
                          styleSize="sm"
                          onClick={() => handleDeleteBlock(index)}
                          title="Delete block"
                          class="-mr-2 bg-transparent border-stone-500/20"
                        >
                          <Trash2 class="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                  {index < blocks.length - 1 && (
                    <div
                      class="absolute bottom-0 left-0 w-full h-2 bg-stone-300 dark:bg-stone-600 cursor-ns-resize active:bg-primary hover:bg-primary transition-colors"
                      onMouseDown={(e) => handleDragStart(e, index)}
                      onTouchStart={(e) => handleDragStart(e, index)}
                    />
                  )}
                </div>
              ))}
            </div>
            <Button class="mt-2" onClick={handleAddBlock}>
              <Plus class="w-5 h-5 -ml-2 mr-1" /> Add
            </Button>
          </div>
        </>
      )}
    </div>
  );
};
