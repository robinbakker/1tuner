import { getPodcastUrlID, normalizedUrlWithoutScheme, slugify, stripHtml } from '~/lib/utils';
import { Podcast } from '~/store/types';
import { Card, CardContent } from './ui/card';

interface Props {
  podcast: Podcast;
  size?: 'default' | 'large';
}

export const PodcastCard = ({ podcast, size }: Props) => {
  if (size === 'large') {
    return (
      <a href={`/podcast/${slugify(podcast.title)}/${btoa(normalizedUrlWithoutScheme(podcast.url))}`} className="group">
        <Card className="rounded-xl border bg-card shadow-lg hover:shadow-xl transition-all">
          <CardContent className="flex items-start space-x-4 p-4">
            <img
              src={podcast.imageUrl}
              alt={podcast.title}
              className="w-24 h-24 object-cover flex-shrink-0 rounded-md"
            />
            <div className="flex-1  min-w-0">
              <h3 className="font-bold text-foreground leading-5 group-hover:text-primary text-lg transition-colors duration-500 mb-2 break-words">
                {podcast.title}
              </h3>
              <p className="text-sm text-stone-600 line-clamp-2">{stripHtml(podcast.description)}</p>
            </div>
          </CardContent>
        </Card>
      </a>
    );
  }
  return (
    <a
      class="block w-28 h-28 group"
      href={`/podcast/${slugify(podcast.title)}/${getPodcastUrlID(podcast.url)}`}
      title={podcast.title}
    >
      <div class="w-full h-full relative overflow-hidden rounded-xl border bg-card shadow-lg hover:shadow-xl transition-all">
        <div
          class="absolute inset-0 w-full h-full bg-cover bg-center"
          style={{
            backgroundImage: `url(${podcast.imageUrl})`,
            filter: 'blur(1.5rem)',
            opacity: 0.3,
            transform: 'scale(2)',
          }}
        />
        <div class="relative h-full flex flex-col items-center pt-2">
          <img src={podcast.imageUrl} alt={`${podcast.title} logo`} class="w-16 h-16 rounded-lg" />
          <div class="absolute bottom-0 left-0 right-0 bg-white dark:bg-stone-700 py-1 px-2">
            <span class="text-center font-bold text-foreground group-hover:text-primary text-sm truncate w-full block transition-colors">
              {podcast.title}
            </span>
          </div>
        </div>
      </div>
    </a>
  );
};
