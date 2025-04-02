import { computed } from '@preact/signals';
import { ContentSection } from '~/components/content-section';
import { PodcastCard } from '~/components/podcast-card';
import { RadioStationCard } from '~/components/radio-station-card';
import { ShareButton } from '~/components/share-button';
import { styleClass } from '~/lib/styleClass';
import { featuredPodcasts, recentlyVisitedPodcasts } from '~/store/signals/podcast';
import { recentlyVisitedRadioStations } from '~/store/signals/radio';

const homepagePodcasts = computed(() => {
  if (recentlyVisitedPodcasts.value.length > 10) {
    return recentlyVisitedPodcasts.value.slice(0, 10);
  }
  return (recentlyVisitedPodcasts.value || [])
    .concat(featuredPodcasts.value.filter((p) => !recentlyVisitedPodcasts.value.some((rp) => p.id === rp.id)))
    .slice(0, 10);
});

export const Homepage = () => {
  return (
    <>
      <header class="relative w-full -mt-1 mb-6">
        <div
          class="inset-0 w-full h-full flex justify-between bg-cover bg-center"
          style={{ backgroundImage: "url('./header-bg.jpg')" }}
        >
          <div class="h-full px-4 py-6">
            <img src="./logo-text-white.svg" alt="1tuner logo" class="h-14 relative z-10" />
          </div>
          <div class="flex items-center pr-4">
            <ShareButton hasDarkBackground={true} />
          </div>
        </div>
      </header>
      <ContentSection title="Radio stations" moreLink="/radio-stations" hasSearchButton isScrollable>
        <ul class="flex gap-6 md:gap-10 px-4 md:px-6">
          {recentlyVisitedRadioStations.value.map((station) => (
            <li class="shrink-0">
              <RadioStationCard key={station.id} station={station} />
            </li>
          ))}
          <li class="shrink-0 w-0.5"></li>
        </ul>
      </ContentSection>
      <ContentSection title="Podcasts" moreLink="/podcasts" hasSearchButton isScrollable>
        <ul class="flex gap-6 md:gap-10 px-4 md:px-6">
          {homepagePodcasts.value.map((podcast) => (
            <li class="shrink-0">
              <PodcastCard key={podcast.id} podcast={podcast} />
            </li>
          ))}
          <li class="shrink-0 w-0.5"></li>
        </ul>
      </ContentSection>
      <ContentSection title="About 1tuner.com">
        <>
          <p class="pb-4">
            With this free app you can listen to online{' '}
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
        </>
      </ContentSection>
    </>
  );
};
