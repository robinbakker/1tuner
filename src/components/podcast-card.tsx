import { normalizedUrlWithoutScheme, slugify, stripHtml } from '~/lib/utils';
import { Podcast } from '~/store/types';
import { Card, CardContent } from './ui/card';

interface Props {
  podcast: Podcast;
  size?: 'default' | 'large';
}

export const PodcastCard = ({ podcast }: Props) => {
  return (
    <a
      key={podcast.id}
      href={`/podcast/${slugify(podcast.title)}/${btoa(normalizedUrlWithoutScheme(podcast.url))}`}
      className="group"
    >
      <Card className="transition-shadow hover:shadow-md">
        <CardContent className="flex items-start space-x-4 p-4">
          <img src={podcast.imageUrl} alt={podcast.title} className="w-24 h-24 object-cover flex-shrink-0 rounded-md" />
          <div className="flex-1  min-w-0">
            <h3 className="text-xl font-semibold mb-2 break-words group-hover:underline">{podcast.title}</h3>
            <p className="text-sm text-gray-600 line-clamp-2">{stripHtml(podcast.description)}</p>
          </div>
        </CardContent>
      </Card>
    </a>
  );
};
