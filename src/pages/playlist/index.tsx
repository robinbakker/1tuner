import { Button } from '~/components/ui/button';
import { Input } from '~/components/ui/input';
import { usePlaylist } from './usePlaylist';

export const PlaylistPage = () => {
  const { playlistName, playlist, isEditMode, editName, handleNameInput, handleSaveClick, handleCancelClick } =
    usePlaylist();

  return (
    <div class="container mx-auto px-8 py-6">
      <h1 class="text-3xl font-bold mb-6">{playlistName}</h1>
      <section class="mb-8 relative">
        {playlist.map((i) => (
          <div key={i.time} class="mb-4">
            <time>{i.time}</time> {i.station.name}
          </div>
        ))}
      </section>
      {isEditMode && (
        <>
          <Input type="text" placeholder={'Playlist name'} class="mb-4" value={editName} onInput={handleNameInput} />
          <div>
            {playlist.map((i) => (
              <div key={i.time} class="mb-4">
                <Input type="time" value={i.time} /> {i.station.name}
              </div>
            ))}
          </div>
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
