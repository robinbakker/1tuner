import { RadioStationCard } from '~/components/radio-station-card';
import { Card, CardContent } from '~/components/ui/card';
import { ScrollArea, ScrollBar } from '~/components/ui/scroll-area';
import { normalizedUrlWithoutScheme, slugify } from '~/lib/utils';
import { recentlyVisitedPodcasts } from '~/store/signals/podcast';
import { getRecentlyVisitedRadioStations } from '~/store/signals/radio';

export const Homepage = () => {
  return (
    <>
      <header className="relative w-full mb-8">
        <div className="inset-0 w-full h-full bg-cover bg-center" style={{ backgroundImage: "url('./header-bg.jpg')" }}>
          <div className="container mx-auto h-full px-4 py-6">
            <img src="./logo-text-white.svg" alt="1tuner logo" className="h-14 relative z-10" />
          </div>
        </div>
      </header>
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
              {getRecentlyVisitedRadioStations().map((station) => (
                <RadioStationCard key={station.id} station={station} />
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
              {recentlyVisitedPodcasts.value.map((podcast) => (
                <a
                  key={podcast.id}
                  href={`/podcast/${slugify(podcast.title)}/${btoa(normalizedUrlWithoutScheme(podcast.url))}`}
                  class="shrink-0"
                >
                  <Card class="w-[100px]">
                    <CardContent class="p-2">
                      <img src={podcast.imageUrl} alt={podcast.title} width={80} height={80} class="rounded-md mb-2" />
                      <p class="text-sm text-center truncate">{podcast.title}</p>
                    </CardContent>
                  </Card>
                </a>
              ))}
            </div>
            <ScrollBar orientation="horizontal" />
          </ScrollArea>
        </section>

        {/* <section class="px-4">
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
      </section> */}
      </div>
    </>
  );
};
