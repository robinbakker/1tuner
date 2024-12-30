import { RadioButtonList } from '~/components/ui/radio-button-list';
import { styleClass } from '~/lib/styleClass';
import { APP_VERSION } from '~/lib/version';
import { settingsState } from '~/store/signals/settings';
import { useSettings } from './useSettings';

export const SettingsPage = () => {
  const {
    theme,
    themeOptions,
    searchProviderOptions,
    handleThemeChange,
    handleSearchProviderChange,
    handleRadioReconnectsValueChange,
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
          value={settingsState.value?.podcastSearchProvider}
          onChange={handleSearchProviderChange}
        />
      </section>
      <section class="mb-8 relative">
        <h2 class="text-2xl font-semibold">Radio stream reconnect</h2>
        <p class="text-muted-foreground text-sm mb-4">
          When switching from networks (e.g. going from wifi to cellular), the radio stream may be interrupted. This
          setting allows you to specify a number of times the player will try to reconnect to the stream automatically.
        </p>
        <select title="Radio stream reconnect" onChange={handleRadioReconnectsValueChange} class={styleClass.select}>
          <option value="0">Never</option>
          <option value="5">5 times</option>
          <option value="10">10 times</option>
          <option value="20">20 times</option>
          <option value="30">30 times</option>
          <option value="40" selected>
            40 times
          </option>
          <option value="50">50 times</option>
          <option value="100">100 times</option>
        </select>
      </section>
      <p class="text-muted-foreground text-sm">v{APP_VERSION}</p>
    </div>
  );
};
