import { useEffect } from 'preact/hooks';
import { useHead } from '~/hooks/useHead';
import { styleClass } from '~/lib/styleClass';
import { APP_VERSION } from '~/lib/version';
import { uiState } from '~/store/signals/ui';

export const AboutPage = () => {
  useHead({
    title: 'About',
  });

  useEffect(() => {
    uiState.value = {
      ...uiState.value,
      headerTitle: 'About',
      headerDefaultTextColor: 'default',
    };

    return () =>
      (uiState.value = {
        ...uiState.value,
        headerTitle: '',
        headerDefaultTextColor: 'default',
      });
  });

  return (
    <div class="container mx-auto px-8 py-6">
      <h1 class="text-3xl font-bold mb-6">About</h1>
      <p class="pb-4">
        Here you can listen to online{' '}
        <a href="/radio-stations" class={styleClass.textLink}>
          radio stations
        </a>{' '}
        and{' '}
        <a href="/podcasts" class={styleClass.textLink}>
          podcasts
        </a>
        . And create your own ideal radio listening day, so the player switches between radio streams automatically.
      </p>
      <p class="pb-4">
        This is a free web app, no account needed and no ads. Add or install this site to your homescreen for the best
        experience!
      </p>
      <h2 class="text-2xl font-semibold">Cookies, tracking, privacy...</h2>
      <p class="pb-4">I guess I'm not that much interested in you! However, to keep things functional:</p>
      <ul class="pb-4 list-disc pl-6">
        <li class="pb-2">
          Some basic information is stored in your browser for your preferences and to store your playlists. You can
          manage some of this data at the{' '}
          <a href="/settings" class={styleClass.textLink}>
            settings
          </a>{' '}
          page. You can also delete you browser data to remove all stored information.{' '}
        </li>
        <li class="pb-2">
          For visitor statistics I use{' '}
          <a href="https://www.cloudflare.com/web-analytics" class={styleClass.textLink} target="_blank" rel="noopener">
            Cloudflare Web Analytics
          </a>
          . No personal data is shared or stored.
        </li>
        <li class="pb-2">
          The audio and logos are loaded from the radio stations / podcast sources directly or via{' '}
          <a href="https://cloudinary.com" class={styleClass.textLink} target="_blank" rel="noopener">
            cloudinary.com
          </a>
          . Radio stations or podcast providers may use some sort of tracking on the media requests.
        </li>
        <li class="pb-2">
          Either the{' '}
          <a href="https://podcastindex.org" target="_blank" rel="noopener" class={styleClass.textLink}>
            podcastindex.org
          </a>{' '}
          API or the Apple iTunes Search API is used for the{' '}
          <a href="/podcasts" class={styleClass.textLink}>
            podcast
          </a>{' '}
          search functionality. You can change this at the{' '}
          <a href="/settings" class={styleClass.textLink}>
            settings
          </a>{' '}
          page.
        </li>
        <li class="pb-2">
          If needed, the podcast RSS feed will be requested via a pass-through website, currently via a{' '}
          <a href="https://www.cloudflare.com" class={styleClass.textLink} target="_blank" rel="noopener">
            Cloudflare Worker
          </a>
          .
        </li>
      </ul>
      <h2 class="text-2xl font-semibold">Who?</h2>
      <p class="pb-4">
        This is a side project from{' '}
        <a href="https://robinbakker.nl" class={styleClass.textLink} target="_blank" rel="noopener me">
          Robin Bakker
        </a>
        . Read more:{' '}
        <a
          href="https://robinbakker.nl/en/blog/creating-a-web-app-as-side-project"
          class={styleClass.textLink}
          rel="noopener"
          target="_blank"
        >
          Creating a web app as side project
        </a>
        . You can find 1tuner at{' '}
        <a href="https://github.com/robinbakker/1tuner" class={styleClass.textLink} rel="noopener" target="_blank">
          GitHub
        </a>{' '}
        as well.
        <br />
        Do you miss a feature? Spotted a bug? Oh no! Please let me know:{' '}
        <a href="https://bsky.app/profile/1tuner.com" class={styleClass.textLink} rel="noopener me" target="_blank">
          @1tuner.com
        </a>
        .
      </p>
      <p class="pb-4">
        Or{' '}
        <a href="https://paypal.me/RobinBakker" class={styleClass.textLink} target="_blank" rel="noopener">
          buy me a ☕ + 🍪
        </a>
        !
      </p>
      <p class="text-muted-foreground text-sm">v{APP_VERSION}</p>
    </div>
  );
};
