import { TriangleAlert } from 'lucide-preact';
import { Button } from '~/components/ui/button';
import { RadioButtonList } from '~/components/ui/radio-button-list';
import { Switch } from '~/components/ui/switch';
import { styleClass } from '~/lib/styleClass';
import { APP_VERSION } from '~/lib/version';
import { useSettings } from './useSettings';

export const SettingsPage = () => {
  const {
    theme,
    themeOptions,
    searchProviderOptions,
    searchProviderValue,
    radioStreamMaxReconnectsValue,
    hasGoogleCastsSupport,
    handleThemeChange,
    handleSearchProviderChange,
    handleRadioReconnectsValueChange,
    handleGoogleCastSupportChange,
    handleResetClick,
  } = useSettings();

  return (
    <div class="container mx-auto px-8 pb-6">
      <h1 class="text-3xl font-bold mb-6">Settings</h1>
      <p class="pb-4">
        1tuner is a free web app. Here you can listen to online{' '}
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
        This app stores information in your browser to save your preferences and Cloudflare Web Analytics is used for
        basic analytics.{' '}
      </p>
      <p class="pb-4">
        <Button asChild variant={`outline`}>
          <a href="/about" class={styleClass.textLink}>
            More about 1tuner.com
          </a>
        </Button>
      </p>
      <section class="mb-8 relative">
        <h2 class="text-2xl font-semibold">Theme</h2>
        <p class="text-muted-foreground text-sm mb-4">Just like Star Wars - choose your theme preference here.</p>
        <RadioButtonList options={themeOptions} name="theme" value={theme} onChange={handleThemeChange} />
      </section>
      <section class="mb-8 relative">
        <h2 class="text-2xl font-semibold">Podcast search provider</h2>
        <p class="text-muted-foreground text-sm mb-4">
          When searching for podcasts, third party providers are used. You can choose which one to use.
        </p>
        <RadioButtonList
          options={searchProviderOptions}
          name="searchProvider"
          value={searchProviderValue}
          onChange={handleSearchProviderChange}
        />
      </section>
      <section class="mb-8 relative">
        <h2 class="text-2xl font-semibold">Radio stream reconnect</h2>
        <p class="text-muted-foreground text-sm mb-4">
          When switching from networks (e.g. going from wifi to cellular), the radio stream may be interrupted. This
          setting allows you to specify a number of times the player will try to reconnect to the stream automatically
          (or never).
        </p>
        <select
          title="Radio stream reconnect"
          value={radioStreamMaxReconnectsValue}
          onChange={handleRadioReconnectsValueChange}
          class={styleClass.select}
        >
          <option value="0">Never</option>
          <option value="10">10 times</option>
          <option value="50">50 times</option>
          <option value="100">100 times</option>
        </select>
      </section>
      <section class="mb-8 relative">
        <h2 class="text-2xl font-semibold">Google Cast (Chromecast) support</h2>
        <p class="text-muted-foreground text-sm mb-4">
          Enable this option to support playing to a Chromecast or Google Cast enabled device (this is behind a toggle
          because it loads an extra external script from gstatic.com).
        </p>
        <Switch id="googleCastSupport" checked={hasGoogleCastsSupport} onClick={handleGoogleCastSupportChange} />
      </section>
      <section class="mb-8 relative">
        <h2 class="text-2xl font-semibold">Reset</h2>
        <p class="text-muted-foreground text-sm mb-4">
          The following button will reset all your settings and remove listening data. It means that all data will be
          reset to their defaults.
        </p>
        <Button variant={'outline'} onClick={handleResetClick}>
          <TriangleAlert class="mr-2 w-4 opacity-50" /> Reset
        </Button>
      </section>
      <p class="text-muted-foreground text-sm">v{APP_VERSION}</p>
    </div>
  );
};
