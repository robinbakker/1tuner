import { Bookmark, Play } from 'lucide-preact';
import { Loader } from '~/components/loader';
import { Badge } from '~/components/ui/badge';
import { Button } from '~/components/ui/button';
import { stripHtml } from '~/lib/utils';
import { playerState } from '~/store/signals/player';
import { usePodcast } from './usePodcast';

export const PodcastPage = () => {
  const { isLoading, podcast, isFollowing, params, toggleFollow } = usePodcast();

  if (isLoading) {
    return <Loader />;
  }

  if (!podcast) {
    return <div>Podcast not found</div>;
  }

  return (
    <div class="container mx-auto p-4">
      <header class="mb-8 flex flex-col md:flex-row gap-6">
        <img
          src={podcast.imageUrl}
          alt={`${podcast.title} Podcast`}
          width={200}
          height={200}
          class="w-48 h-48 rounded-lg"
        />
        <div class="flex-1">
          <h1 class="text-4xl font-bold mb-2">{podcast.title}</h1>
          <p class="text-stone-600 mb-4">{stripHtml(podcast.description)}</p>
          <div class="flex flex-wrap gap-2 mb-4">
            {podcast?.categories?.map((category, index) => (
              <Badge key={index} variant="secondary">
                {category}
              </Badge>
            ))}
          </div>
          <Button onClick={toggleFollow} variant={isFollowing ? 'secondary' : 'default'}>
            <Bookmark class={`mr-2 h-4 w-4 ${isFollowing ? 'fill-current' : ''}`} />
            {isFollowing ? 'Following' : 'Follow'}
          </Button>
        </div>
      </header>
      <section>
        <div class="space-y-6">
          {podcast.episodes?.map((episode, i) => (
            <div key={`ep-${episode.pubDate}-${i}`} class="border-b border-stone-200 pb-6">
              <div class="flex items-center justify-between mb-2">
                <h3 class="text-xl font-medium">{episode.title}</h3>
                <span class="text-sm text-stone-500">{episode.duration}</span>
              </div>
              <p class="text-stone-600 mb-4">{stripHtml(episode.description)}</p>
              <Button
                variant="outline"
                styleSize="sm"
                onClick={() => {
                  playerState.value = {
                    isPlaying: true,
                    contentID: params.id,
                    title: episode.title,
                    description: podcast.title,
                    imageUrl: podcast.imageUrl,
                    streams: [{ mimetype: 'audio/mpeg', url: episode.audio }],
                    pageLocation: `/podcast/${params.name}/${params.id}`,
                    currentTime: episode.currentTime || 0,
                  };
                }}
              >
                <Play class="mr-2 h-4 w-4" />
                Play Episode
              </Button>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
};
