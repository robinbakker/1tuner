'use client';

import { Button } from '@/components/ui/button';
import { Podcast } from '@/lib/db';
import { getSignature } from '@/lib/signature';
import { stripHtml } from '@/lib/utils';
import { XMLParser } from 'fast-xml-parser';
import { Heart } from 'lucide-preact';
import { useRoute } from 'preact-iso';
import { useEffect, useState } from 'preact/hooks';
import {
  addToRecentlyVisited,
  followPodcast,
  getPodcast,
  headerTitle,
  isFollowedPodcast,
  unfollowPodcast,
  updatePodcast,
} from '../lib/store';
import { Loader } from './loader';
import { Badge } from './ui/badge';

export function PodcastPage() {
  const { params } = useRoute();
  const [isLoading, setIsLoading] = useState(true);
  const [isFollowing, setIsFollowing] = useState(false);
  const [podcast, setPodcast] = useState<Podcast | null>(null);

  useEffect(() => {
    const fetchPodcastData = async () => {
      if (!params.id) return;

      setIsLoading(true);
      let podcastData = getPodcast(params.id);

      if (!podcastData || Date.now() - podcastData.lastFetched > 24 * 60 * 60 * 1000) {
        try {
          const url = `https://robinbakker-umbilical-71.deno.dev/API/worker/proxy?rss=https://${encodeURIComponent(atob(params.id))}`;
          const signature = await getSignature(url);
          const response = await fetch(url, {
            headers: {
              'X-Umbilical-Signature': signature,
            },
          });

          if (!response.ok) {
            throw new Error('Failed to fetch podcast');
          }

          const xmlData = await response.text();
          const parser = new XMLParser({
            ignoreAttributes: false,
            attributeNamePrefix: '@_',
          });
          const result = parser.parse(xmlData);

          if (!result.rss || !result.rss.channel) {
            throw new Error('Invalid podcast RSS feed structure');
          }

          const channel = result.rss.channel;
          const feedUrl = `https://${atob(params.id)}`;

          podcastData = {
            id: params.id,
            title: channel.title,
            description: channel.description,
            imageUrl: channel.image?.url || '',
            url: feedUrl,
            feedUrl: feedUrl,
            categories: channel.categories,
            addedDate: podcastData?.addedDate || Date.now(),
            lastFetched: Date.now(),
            episodes: (channel.item || []).slice(0, 50).map((item: any) => ({
              title: item.title,
              description: item.description,
              pubDate: new Date(item.pubDate),
              audio: item.enclosure?.['@_url'],
              duration: item['itunes:duration'],
            })),
          } as Podcast;

          updatePodcast(podcastData);
        } catch (error) {
          console.error('Error fetching podcast:', error);
          setIsLoading(false);
          return;
        }
      }

      headerTitle.value = podcastData.title;

      addToRecentlyVisited(podcastData);
      setPodcast(podcastData);

      if (isFollowedPodcast(params.id)) {
        setIsFollowing(true);
      }

      setIsLoading(false);
    };

    fetchPodcastData();

    return () => {
      headerTitle.value = '';
    };
  }, [params.id]);

  const toggleFollow = () => {
    if (!podcast) return;

    if (isFollowing) {
      unfollowPodcast(params.id);
    } else {
      followPodcast(podcast);
    }
    setIsFollowing(!isFollowing);
  };

  if (isLoading) {
    return <Loader />;
  }

  if (!podcast) {
    return <div>Podcast not found</div>;
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <header className="mb-8 flex flex-col md:flex-row gap-6">
        <img src={podcast.imageUrl} alt={`${podcast.title} Podcast`} width={200} height={200} className="w-48 h-48 rounded-lg" />
        <div className="flex-1">
          <h1 className="text-4xl font-bold mb-2">{podcast.title}</h1>
          <p className="text-gray-600 mb-4">{stripHtml(podcast.description)}</p>
          <div className="flex flex-wrap gap-2 mb-4">
            {podcast?.categories?.map((category, index) => (
              <Badge key={index} variant="secondary">
                {category}
              </Badge>
            ))}
          </div>
          <Button onClick={toggleFollow} variant={isFollowing ? 'secondary' : 'default'}>
            <Heart className={`mr-2 h-4 w-4 ${isFollowing ? 'fill-current' : ''}`} />
            {isFollowing ? 'Following' : 'Follow'}
          </Button>
        </div>
      </header>
      <section>
        <h2 className="text-2xl font-semibold mb-4">Latest Episodes</h2>
        <div className="space-y-6">
          {podcast.episodes?.map((episode, i) => (
            <div key={`ep-${episode.pubDate}-${i}`} className="border-b border-gray-200 pb-6">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-xl font-medium">{episode.title}</h3>
                <span className="text-sm text-gray-500">{episode.duration}</span>
              </div>
              <p className="text-gray-600 mb-4">{stripHtml(episode.description)}</p>
              <Button variant="outline" styleSize="sm">
                {/*<Play className="mr-2 h-4 w-4" />*/}
                Play Episode
              </Button>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
