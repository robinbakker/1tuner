import { Bookmark, Play } from 'lucide-preact';
import { useLocation } from 'preact-iso';
import { Loader } from '~/components/loader';
import { Badge } from '~/components/ui/badge';
import { Button } from '~/components/ui/button';
import { cn, getTimeStringFromSeconds, stripHtml } from '~/lib/utils';
import { usePodcast } from './usePodcast';

export const PodcastPage = () => {
  const { route } = useLocation();
  const { params, isLoading, podcast, isFollowing, toggleFollow, handleEpisodeClick } = usePodcast();

  if (typeof window !== 'undefined' && !params.id) {
    route('/podcasts');
    return <></>;
  }

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
              <div class="flex group items-center justify-between mb-2">
                <div class={'cursor-pointer'} onClick={() => handleEpisodeClick(episode)}>
                  <h3 class="text-xl font-medium group-hover:text-primary transition-colors">
                    {episode.title}{' '}
                    <span class="text-muted-foreground font-normal text-sm">
                      ({episode.duration}
                      {episode.currentTime ? ` - ${getTimeStringFromSeconds(episode.currentTime)}` : ''})
                    </span>
                  </h3>
                  <p class="text-muted-foreground text-sm">
                    <time dateTime={episode.pubDate.toJSON()}>
                      {episode.pubDate.toLocaleDateString(undefined, {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                        weekday: 'long',
                      })}
                    </time>
                  </p>
                </div>
                <div>
                  <Button
                    onClick={() => handleEpisodeClick(episode)}
                    variant="outline"
                    styleSize="icon"
                    class={cn(
                      'border-stone-300 group-hover:bg-primary group-hover:border-primary',
                      'group-hover:text-primary-foreground hover:text-primary-foreground transition-colors',
                    )}
                  >
                    <Play class="h-4 w-4" />
                  </Button>
                </div>
              </div>
              <p class="text-stone-600 mb-4">{stripHtml(episode.description)}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
};
