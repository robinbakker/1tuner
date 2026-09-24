import { computed } from '@preact/signals';
import { For } from '@preact/signals/utils';
import { Info } from 'lucide-preact';
import { useState } from 'preact/hooks';
import { ContentSection } from '~/components/content-section';
import { PodcastCard } from '~/components/podcast-card';
import { RadioStationCard } from '~/components/radio-station-card';
import { ShareButton } from '~/components/share-button';
import { Button } from '~/components/ui/button';
import { styleClass } from '~/lib/styleClass';
import { featuredPodcasts, recentlyVisitedPodcasts } from '~/store/signals/podcast';
import { recentlyVisitedRadioStationIDs, recentlyVisitedRadioStations } from '~/store/signals/radio';
import { hasAppUpdatedMessage } from '~/store/signals/ui';

const homepagePodcasts = computed(() => {
  if (recentlyVisitedPodcasts.value.length > 10) {
    return recentlyVisitedPodcasts.value.slice(0, 10);
  }
  return (recentlyVisitedPodcasts.value || [])
    .concat(featuredPodcasts.value.filter((p) => !recentlyVisitedPodcasts.value.some((rp) => p.id === rp.id)))
    .slice(0, 10);
});

const hasListeningHistory = computed(
  () => !!(recentlyVisitedRadioStationIDs.value.length || recentlyVisitedPodcasts.value.length),
);

const tipsAndTricks = [
  {
    title: 'Add to homescreen',
    description:
      'You can add this app to your homescreen for a better experience. On iOS, tap the share button and then "Add to Home Screen". On Android, tap the menu button and then "Add to Home screen".',
  },
  {
    title: 'Follow your favorite stations & podcasts',
    description:
      'You can follow your favorite radio stations and podcasts by clicking the "Follow" button on their page. This will make them appear more prominently throughout the app.',
  },
  {
    title: 'Create playlists',
    description: 'You can create playlists of radio stations to switch automatically throughout the day.',
    link: {
      text: 'Playlist example',
      href: '/playlist/Kink%20Pinguin/?h00=kink&h12=3fm&h14=veronica&h16=pinguinradio&tz=Europe/Amsterdam',
    },
  },
  {
    title: 'Enable Google Cast',
    description:
      'You can enable Google Cast to listen to your favorite radio stations and podcasts on your TV or other devices. Go to "Settings" and enable "Google Cast support". When enabled, click the "Cast" button on the player and select your device.',
    link: { text: 'Settings', href: '/settings' },
  },
  {
    title: 'Use media keys to control playback',
    description: 'You can use your device\'s media keys to control playback of radio stations and podcasts. With radio, use ⏮️ & ⏭️ to switch between recent stations. With podcasts, use ⏭️ to skip 30 seconds, ⏮️ 10 seconds.',
  }
];

export const Homepage = () => {
  const [isIntroVisible, setIsIntroVisible] = useState(!hasListeningHistory.value);
  const [tip] = useState(tipsAndTricks[Math.floor(Math.random() * tipsAndTricks.length)]);

  return (
    <>
      <header class="relative w-full -mt-1 mb-4">
        <div
          class="inset-0 w-full h-full flex justify-between bg-cover bg-center"
          style={{ backgroundImage: "url('./header-bg.jpg')" }}
        >
          <div class="h-full px-4 py-6">
            <img src="./logo-text-white.svg" alt="1tuner logo" class="h-14 relative z-10" />
          </div>
          <div class="flex items-center pr-4">
            <button
              type="button"
              onClick={() => setIsIntroVisible((visible) => !visible)}
              class={`p-2 rounded-full cursor-pointer transition-colors duration-200 hover:bg-stone-200/20 focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-white${isIntroVisible ? ' bg-white/35' : ''}`}
              title={isIntroVisible ? 'Hide information' : 'Show information'}
              aria-label={isIntroVisible ? 'Hide information' : 'Show information'}
              aria-expanded={isIntroVisible}
              aria-controls="homepage-intro"
            >
              <Info class="h-6 w-6 text-white" />
            </button>
            <ShareButton hasDarkBackground={true} />
          </div>
        </div>
      </header>
      <div id="homepage-intro" class="mx-4 mb-4 py-4 px-6 bg-black/5 dark:bg-black/30 rounded-lg" hidden={!isIntroVisible}>
        <ContentSection className="mb-0" hasNoPadding title="Listen to online radio & podcasts">
          <>
            {hasAppUpdatedMessage.value && (
              <p class="pb-4 text-sm text-gray-500">
                ℹ️ 1tuner has been updated! You can now "follow" radio stations and podcasts, and lots of other
                improvements where made. I hope you like it!
              </p>
            )}
            <p>
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
              . Just add this site to your homescreen and you're good to go!
              <br />
              All information is stored locally in your browser to save your preferences and Cloudflare Web Analytics is
              used for basic analytics.{' '}
              <a href="/about" class={styleClass.textLink}>
                Read more...
              </a>
            </p>
          </>
        </ContentSection>
      </div>
      <ContentSection title="Radio stations" moreLink="/radio-stations" hasSearchButton isScrollable>
        <ul class="flex gap-6 md:gap-10 px-4 md:px-6">
          <For each={recentlyVisitedRadioStations}>
            {(station) => (
              <li class="shrink-0">
                <RadioStationCard station={station} />
              </li>
            )}
          </For>
          <li class="shrink-0 w-0.5"></li>
        </ul>
      </ContentSection>
      <ContentSection title="Podcasts" moreLink="/podcasts" hasSearchButton isScrollable>
        <ul class="flex gap-6 md:gap-10 px-4 md:px-6">
          <For each={homepagePodcasts}>
            {(podcast) => (
              <li class="shrink-0">
                <PodcastCard podcast={podcast} />
              </li>
            )}
          </For>
          <li class="shrink-0 w-0.5"></li>
        </ul>
      </ContentSection>
      <ContentSection title={`💡 ${tip.title}`}>
        <>
          <p class="pb-4">{tip.description}</p>
          {tip.link && (
            <p class="pb-4">
              <Button asChild variant="outline">
                <a href={tip.link.href} class={styleClass.textLink}>
                  {tip.link.text}
                </a>
              </Button>
            </p>
          )}
        </>
      </ContentSection>
    </>
  );
};
