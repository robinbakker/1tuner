import { useHead } from '~/hooks/useHead';

export const NotFound = () => {
  useHead({
    title: '404 - Page not found',
  });
  return (
    <div class="container mx-auto px-8 py-6">
      <h1 class="text-3xl font-bold mb-6">Page not found... 😢</h1>
      <section class="mb-8 relative">
        <p>Maybe try another page?</p>
      </section>
    </div>
  );
};
