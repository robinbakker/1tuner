import { useCallback } from 'preact/hooks';
import { PodcastCard } from '~/components/podcast-card';
import { RadioStationCard } from '~/components/radio-station-card';
import { ShareButton } from '~/components/share-button';
import { Button } from '~/components/ui/button';
import { styleClass } from '~/lib/styleClass';
import { recentlyVisitedPodcasts } from '~/store/signals/podcast';
import { getRecentlyVisitedRadioStations } from '~/store/signals/radio';

export const Homepage = () => {
  const MoreLink = useCallback(({ location }: { location: string }) => {
    return (
      <Button asChild variant="outline">
        <a href={location}>More</a>
      </Button>
    );
  }, []);

  return (
    <>
      <header class="relative w-full -mt-1 mb-6">
        <div
          class="inset-0 w-full h-full flex justify-between bg-cover bg-center"
          style={{ backgroundImage: "url('./header-bg.jpg')" }}
        >
          <div className="h-full px-4 py-6">
            <img src="./logo-text-white.svg" alt="1tuner logo" className="h-14 relative z-10" />
          </div>
          <div class="flex items-center pr-4">
            <ShareButton hasDarkBackground={true} />
          </div>
        </div>
      </header>

      <section class="mb-8">
        <div class="flex justify-between items-center mb-2 px-4 md:px-6">
          <h2 class="text-2xl font-semibold">Radio stations</h2>
          <MoreLink location="/radio-stations" />
        </div>
        <div class="relative w-full overflow-hidden">
          <div class="overflow-x-auto pb-4">
            <div class="flex gap-4 md:gap-10 px-4 md:px-6">
              {getRecentlyVisitedRadioStations().map((station) => (
                <div class="flex-none">
                  <RadioStationCard key={station.id} station={station} />
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section class="mb-8">
        <div class="flex justify-between items-center mb-2 px-4 md:px-6">
          <h2 class="text-2xl font-semibold">Podcasts</h2>
          <MoreLink location="/podcasts" />
        </div>
        <div class="relative overflow-hidden">
          <div class="overflow-x-auto pb-4">
            <div class="flex gap-4 md:gap-10 px-4 md:px-6">
              {recentlyVisitedPodcasts.value.map((podcast) => (
                <div class="flex-none">
                  <PodcastCard key={podcast.id} podcast={podcast} />
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section class="mb-8">
        <div class="w-full flex justify-between items-center mb-2 px-4 md:px-6">
          <h2 class="text-2xl font-semibold">About 1tuner.com</h2>
          <MoreLink location="/about" />
        </div>
        <div class="px-4 md:px-6">
          <p class="pb-4">
            This is a free web app. Here you can listen to online{' '}
            <a href="/radio-stations" class={styleClass.textLink}>
              radio stations
            </a>
            ,{' '}
            <a href="/podcasts" class={styleClass.textLink}>
              podcasts
            </a>{' '}
            and create{' '}
            <a href="/playlists" class={styleClass.textLink}>
              playlists
            </a>
            .<br />
            Just add this site to your homescreen and you're good to go!
          </p>
          <p class="pb-4">
            This app stores information in your browser to save your preferences and Cloudflare Web Analytics is used
            for basic analytics.{' '}
            <a href="/about" class={styleClass.textLink}>
              Read more
            </a>
          </p>
        </div>
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
                      <p class="text-sm text-stone-200 capitalize">{item.type}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </a>
          ))}
        </div>
      </section> */}
    </>
  );
};
