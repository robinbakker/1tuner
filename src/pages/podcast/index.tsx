import { Bookmark, Play, RefreshCw } from 'lucide-preact';
import { useLocation } from 'preact-iso';
import { useMemo } from 'preact/hooks';
import { Loader } from '~/components/loader';
import { Badge } from '~/components/ui/badge';
import { Button } from '~/components/ui/button';
import { cn, getTimeStringFromSeconds, stripHtml } from '~/lib/utils';
import { usePodcast } from './usePodcast';

export const PodcastPage = () => {
  const { route } = useLocation();
  const {
    params,
    isLoading,
    podcast,
    isFollowing,
    nowPlaying,
    toggleFollow,
    handleEpisodeClick,
    handleFetchNewEpisodes,
  } = usePodcast();

  const lastPlayedEpisode = useMemo(() => {
    return podcast?.episodes?.find((e) => e.currentTime && e.currentTime > 0);
  }, [podcast?.episodes]);

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
    <div class="container @container mx-auto p-4 md:p-8">
      <div class="grid grid-cols-1 @xl:grid-cols-[16rem_1fr] @5xl:grid-cols-[20rem_1fr] gap-8">
        <header class="mb-4 @xl:mb-0 @xl:sticky @xl:top-24 @xl:self-start @xl:h-[calc(100vh-2rem)]">
          <h1 class="text-2xl @5xl:text-3xl font-bold mb-4">{podcast.title}</h1>
          <div class="flex flex-col @xl:flex-col">
            <div class="flex flex-row @xl:flex-col rounded-lg overflow-hidden">
              <img
                src={podcast.imageUrl}
                alt={podcast.title}
                width={200}
                height={200}
                class="w-32 h-32 @xl:w-full @xl:h-auto object-cover"
              />
              {lastPlayedEpisode && (
                <div class="group flex-1 p-3 min-w-0 bg-stone-500/10">
                  <div class="flex items-center gap-2">
                    <div class="min-w-0 flex-1 cursor-pointer" onClick={() => handleEpisodeClick(lastPlayedEpisode)}>
                      <p class="text-sm text-muted-foreground mb-1">Continue Listening</p>
                      <p class="leading-tight font-medium line-clamp-2 max-w-full group-hover:text-primary transition-colors">
                        {lastPlayedEpisode.title}
                      </p>
                      <p class="mt-1 text-xs text-muted-foreground">
                        {getTimeStringFromSeconds(lastPlayedEpisode.currentTime ?? 0)} / {lastPlayedEpisode.duration}
                      </p>
                    </div>
                    <Button
                      onClick={() => handleEpisodeClick(lastPlayedEpisode)}
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
              )}
            </div>
          </div>
          <div class="flex-1">
            <p class="my-3 @xl:mt-1 @max-h-[30vh] p-3 overflow-y-auto">{stripHtml(podcast.description)}</p>
            {!!podcast?.categories?.length && (
              <div class="flex flex-wrap gap-2 mb-4">
                {podcast?.categories?.map((category, index) => (
                  <Badge key={index} variant="secondary">
                    {category}
                  </Badge>
                ))}
              </div>
            )}
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
            {podcast.episodes?.map((episode, i) => {
              const currentTime =
                nowPlaying?.streams[0].url === episode.audio && nowPlaying.currentTime
                  ? nowPlaying.currentTime
                  : episode.currentTime;
              return (
                <div key={`ep-${episode.pubDate}-${i}`} class="border-b border-stone-200 pb-6">
                  <div class="flex group items-center justify-between mb-2">
                    <div class="cursor-pointer" onClick={() => handleEpisodeClick(episode)}>
                      <h3 class="text-xl font-medium group-hover:text-primary transition-colors">
                        {episode.title}{' '}
                        <span class="text-muted-foreground font-normal text-sm">
                          ({currentTime ? `${getTimeStringFromSeconds(currentTime)} / ` : ''}
                          {episode.duration})
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
                  <p class="break-words [word-break:break-word] mb-4">{stripHtml(episode.description)}</p>
                </div>
              );
            })}
          </div>
        </section>
      </div>
    </div>
  );
};
