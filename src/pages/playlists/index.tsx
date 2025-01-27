import { useHead } from '~/hooks/useHead';

export const PlaylistsPage = () => {
  useHead({
    title: 'Playlists',
  });
  return (
    <div class="container mx-auto px-8 py-6">
      <h1 class="text-3xl font-bold mb-6">Playlists</h1>
      <section class="mb-8 relative">
        <p>Under construction</p>
      </section>
    </div>
  );
};
