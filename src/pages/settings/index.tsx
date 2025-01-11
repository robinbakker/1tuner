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
  } = useSettings();

  return (
    <div class="container mx-auto px-8 py-6">
      <h1 class="text-3xl font-bold mb-6">Settings</h1>
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
      <p class="text-muted-foreground text-sm">v{APP_VERSION}</p>
    </div>
  );
};
