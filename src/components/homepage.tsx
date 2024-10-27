import { Card, CardContent } from '@/components/ui/card';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';

// Sample data (replace with your actual data fetching logic)
const recentStations = [
  { id: 1, name: 'Rock 101', image: '/placeholder.svg?height=80&width=80' },
  { id: 2, name: 'Jazz FM', image: '/placeholder.svg?height=80&width=80' },
  { id: 3, name: 'Classical Masters', image: '/placeholder.svg?height=80&width=80' },
  { id: 4, name: 'Pop Hits', image: '/placeholder.svg?height=80&width=80' },
  { id: 5, name: 'News 24/7', image: '/placeholder.svg?height=80&width=80' },
];

const recentPodcasts = [
  { id: 1, name: 'True Crime Stories', image: '/placeholder.svg?height=80&width=80' },
  { id: 2, name: 'Tech Talk Weekly', image: '/placeholder.svg?height=80&width=80' },
  { id: 3, name: 'Mindfulness Meditation', image: '/placeholder.svg?height=80&width=80' },
  { id: 4, name: 'History Uncovered', image: '/placeholder.svg?height=80&width=80' },
  { id: 5, name: 'Science Today', image: '/placeholder.svg?height=80&width=80' },
];

const featuredItems = [
  { id: 1, name: 'Summer Hits Playlist', image: '/placeholder.svg?height=200&width=400', type: 'playlist' },
  { id: 2, name: 'Interview with Music Legend', image: '/placeholder.svg?height=200&width=400', type: 'podcast' },
];

export function Homepage() {
  return (
    <div class="container mx-auto px-0 py-8 overflow-x-hidden">
      <section class="mb-8">
        <div class="flex justify-between items-center mb-4 px-4">
          <h2 class="text-2xl font-semibold">Radio stations</h2>
          <a href="/radio-stations" class="text-sm font-medium text-primary hover:underline">
            More
          </a>
        </div>
        <ScrollArea className="w-screen md:w-full whitespace-nowrap">
          <div class="flex w-max space-x-4 p-4">
            {recentStations.map((station) => (
              <a key={station.id} href={`/station/${station.id}`} class="shrink-0">
                <Card class="w-[100px]">
                  <CardContent class="p-2">
                    <img src={station.image} alt={station.name} width={80} height={80} class="rounded-md mb-2" />
                    <p class="text-sm text-center truncate">{station.name}</p>
                  </CardContent>
                </Card>
              </a>
            ))}
          </div>
          <ScrollBar orientation="horizontal" />
        </ScrollArea>
      </section>

      <section class="mb-8">
        <div class="flex justify-between items-center mb-4 px-4">
          <h2 class="text-2xl font-semibold">Podcasts</h2>
          <a href="/podcasts" class="text-sm font-medium text-primary hover:underline">
            More
          </a>
        </div>
        <ScrollArea className="w-screen md:w-full whitespace-nowrap">
          <div class="flex w-max space-x-4 p-4">
            {recentPodcasts.map((podcast) => (
              <a key={podcast.id} href={`/podcast/${podcast.id}`} class="shrink-0">
                <Card class="w-[100px]">
                  <CardContent class="p-2">
                    <img src={podcast.image} alt={podcast.name} width={80} height={80} class="rounded-md mb-2" />
                    <p class="text-sm text-center truncate">{podcast.name}</p>
                  </CardContent>
                </Card>
              </a>
            ))}
          </div>
          <ScrollBar orientation="horizontal" />
        </ScrollArea>
      </section>

      <section class="px-4">
        <h2 class="text-2xl font-semibold mb-4">Featured</h2>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          {featuredItems.map((item) => (
            <a key={item.id} href={`/${item.type}/${item.id}`}>
              <Card class="w-full">
                <CardContent class="p-0">
                  <div class="relative">
                    <img src={item.image} alt={item.name} width={400} height={200} class="w-full h-auto" />
                    <div class="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black to-transparent p-4">
                      <h3 class="text-xl font-semibold text-white">{item.name}</h3>
                      <p class="text-sm text-gray-200 capitalize">{item.type}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </a>
          ))}
        </div>
      </section>
    </div>
  );
}
