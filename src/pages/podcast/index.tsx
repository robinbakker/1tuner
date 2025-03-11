import { Bookmark, Play, RefreshCw } from 'lucide-preact';
import { useLocation } from 'preact-iso';
import { Loader } from '~/components/loader';
import { Badge } from '~/components/ui/badge';
import { Button } from '~/components/ui/button';
import { cn, getTimeStringFromSeconds, stripHtml } from '~/lib/utils';
import { usePodcast } from './usePodcast';

export const PodcastPage = () => {
  const { route } = useLocation();
  const { params, isLoading, podcast, isFollowing, toggleFollow, handleEpisodeClick, handleFetchNewEpisodes } =
    usePodcast();

  if (typeof window !== 'undefined' && !params.id) {
    route('/podcasts');
    return null;
  }

  if (isLoading && !podcast) {
    return <Loader />;
  }

  if (!podcast) {
    return <div>Podcast not found</div>;
  }

  return (
    <div class="container @container mx-auto p-4">
      <div class="grid grid-cols-1 @md:grid-cols-[16rem_1fr] @lg:grid-cols-[20rem_1fr] gap-8">
        <header class="mb-4 @md:mb-0 @md:sticky @md:top-24 @md:self-start @md:h-[calc(100vh-2rem)]">
          <img
            src={podcast.imageUrl}
            alt={podcast.title}
            width={200}
            height={200}
            class="w-48 h-48 mb-4 @md:w-full @md:mb-6 @md:h-auto rounded-lg object-cover"
          />
          <div class="flex-1">
            <h1 class="text-4xl font-bold mb-2">{podcast.title}</h1>
            <p class="text-stone-600 mb-4 @max-h-[30vh] overflow-y-auto">{stripHtml(podcast.description)}</p>
            <div class="flex flex-wrap gap-2 mb-4">
              {podcast?.categories?.map((category, index) => (
                <Badge key={index} variant="secondary">
                  {category}
                </Badge>
              ))}
            </div>
            <div class="flex flex-wrap justify-between gap mb-4">
              <Button onClick={toggleFollow} variant={isFollowing ? 'secondary' : 'default'}>
                <Bookmark class={`mr-2 h-4 w-4 ${isFollowing ? 'fill-current' : ''}`} />
                {isFollowing ? 'Following' : 'Follow'}
              </Button>
              <Button onClick={handleFetchNewEpisodes} variant={'link'}>
                <RefreshCw class={`mr-2 h-4 w-${isLoading ? ' animate-spin' : ''}`} />
                <time dateTime={new Date(podcast.lastFetched).toJSON()} class="text-muted-foreground text-sm">
                  {new Date(podcast.lastFetched).toLocaleDateString(navigator.language, {
                    month: 'short',
                    day: 'numeric',
                    weekday: 'short',
                    hour: 'numeric',
                    minute: 'numeric',
                  })}
                </time>
              </Button>
            </div>
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
                        {episode.pubDate.toLocaleDateString(navigator.language, {
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
                        'border-stone-300 hover:bg-primary group-hover:bg-primary group-hover:border-primary',
                        'group-hover:text-primary-foreground hover:text-primary-foreground transition-colors',
                      )}
                    >
                      <Play class="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                <p class="text-stone-600 break-words [word-break:break-word] mb-4">{stripHtml(episode.description)}</p>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
};
