import { Button } from '~/components/ui/button';
import { usePlaylist } from './usePlaylist';

export const PlaylistPage = () => {
  const { playlistName, playlist, isEditMode, handleSaveClick, handleCancelClick } = usePlaylist();

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
          <Button variant={'secondary'} onClick={handleCancelClick}>
            Cancel
          </Button>{' '}
          <Button onClick={handleSaveClick}>Save</Button>
        </>
      )}
    </div>
  );
};
