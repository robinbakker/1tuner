import { useEffect } from 'preact/hooks';
import { useHead } from '~/hooks/useHead';
import { styleClass } from '~/lib/styleClass';
import { APP_VERSION } from '~/lib/version';
import { isDBLoaded } from '~/store/db/db';
import { uiState } from '~/store/signals/ui';

export const AboutPage = () => {
  useHead({
    title: 'About',
  });

  useEffect(() => {
    if (!isDBLoaded.value) return;
    const previousState = { ...uiState.value };
    uiState.value = {
      ...previousState,
      headerTitle: 'About',
      headerDefaultTextColor: 'default',
    };

    return () =>
      (uiState.value = {
        ...previousState,
        headerTitle: '',
        headerDefaultTextColor: 'default',
      });
  }, [isDBLoaded.value]);

  return (
    <div class="container mx-auto px-8 py-6">
      <h1 class="text-3xl font-bold mb-6">About</h1>
      <p class="pb-4">
        Welcome to 1tuner.com — your personal mix of online radio and podcasts!
        <br />
        Create your perfect listening day by building a playlist that automatically switches between your favorite radio
        streams.
      </p>
      <p class="pb-4">
        This is a free web app. No account needed. No ads. 💡 Tip: Add it to your home screen for the best experience!
      </p>
      <h2 class="text-2xl mb-2 font-semibold">Privacy, cookies, tracking...</h2>
      <p class="pb-4">I guess I'm not that much interested in you! But here’s what you should know:</p>
      <ul class="pb-4 list-disc pl-6">
        <li class="pb-2">
          Your recently played stations/podcasts, your playlists and settings, are stored in your browser (locally) to
          keep things running smoothly. You can manage this data on the{' '}
          <a href="/settings" class={styleClass.textLink}>
            Settings
          </a>{' '}
          page — or just clear your browser data to reset everything.
        </li>
        <li class="pb-2">
          For visitor statistics I use{' '}
          <a href="https://www.cloudflare.com/web-analytics" class={styleClass.textLink} target="_blank" rel="noopener">
            Cloudflare Web Analytics
          </a>
          . No personal data is shared or stored.
        </li>
        <li class="pb-2">
          Audio and logos are loaded directly from radio stations or podcast sources, or via{' '}
          <a href="https://cloudinary.com" class={styleClass.textLink} target="_blank" rel="noopener">
            cloudinary.com
          </a>
          . Some of these sources may track media requests (just FYI).
        </li>
        <li class="pb-2">
          Podcast search is powered by{' '}
          <a href="https://podcastindex.org" target="_blank" rel="noopener" class={styleClass.textLink}>
            podcastindex.org
          </a>{' '}
          or the Apple iTunes Search API — you can change this on the{' '}
          <a href="/settings" class={styleClass.textLink}>
            Settings
          </a>{' '}
          page.
        </li>
        <li class="pb-2">
          For podcast episode data, the RSS feed is fetched directly from the podcast source. If it fails, it is fetched
          via a pass-through server (currently using a{' '}
          <a href="https://www.cloudflare.com" class={styleClass.textLink} target="_blank" rel="noopener">
            Cloudflare Worker
          </a>
          ).
        </li>
        <li class="pb-2">
          For extended radio data I use{' '}
          <a href="https://www.radio-browser.info" class={styleClass.textLink} target="_blank" rel="noopener">
            radio-browser.info
          </a>
          , which is a free and open API for radio stations.
          <br />
          If a regular search doesn't return results or you'd like to explore more, an extra search can be performed via
          their server. When you play a station, a click is registered on their end for stats purposes — but no personal
          data is shared or stored.
        </li>
      </ul>
      <h2 class="text-2xl mb-2 font-semibold">Who made this?</h2>
      <p class="pb-4">
        This is a side project by{' '}
        <a href="https://robinbakker.nl" class={styleClass.textLink} target="_blank" rel="noopener me">
          Robin Bakker
        </a>
        .<br />
        Curious how it all started? Check out:{' '}
        <a
          href="https://robinbakker.nl/en/blog/creating-a-web-app-as-side-project"
          class={styleClass.textLink}
          rel="noopener"
          target="_blank"
        >
          Creating a web app as side project
        </a>
        . Find the code on{' '}
        <a href="https://github.com/robinbakker/1tuner" class={styleClass.textLink} rel="noopener" target="_blank">
          GitHub
        </a>
        .
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
