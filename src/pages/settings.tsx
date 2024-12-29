import { ChangeEvent } from 'preact/compat';
import { useState } from 'preact/hooks';
import { RadioButtonList, RadioButtonListOption } from '~/components/ui/radio-button-list';
import { styleClass } from '~/lib/styleClass';
import { settingsState } from '~/store/signals/settings';
import { PodcastSearchProvider } from '~/store/types';

type ThemeOption = 'default' | 'light' | 'dark';

export const SettingsPage = () => {
  const [theme, setTheme] = useState<ThemeOption>(
    typeof window !== 'undefined' ? window?.localStorage.theme : 'default',
  );

  const themeOptions: RadioButtonListOption[] = [
    { label: 'Light', value: 'light' },
    { label: 'Dark', value: 'dark' },
    { label: 'System default', value: 'default' },
  ];

  const searchProviderOptions: RadioButtonListOption[] = [
    {
      label: 'Podcast Index',
      description: 'Open index of podcasts offered by podcastindex.org',
      value: PodcastSearchProvider.PodcastIndex,
    },
    {
      label: 'Apple iTunes Search',
      description: 'Podcasts as found within Apple iTunes',
      value: PodcastSearchProvider.Apple,
    },
  ];

  const handleThemeChange = (value: string) => {
    if (value === 'default') {
      window?.localStorage.removeItem('theme');
      document.documentElement.classList.remove('dark', 'light');
    } else {
      window?.localStorage.setItem('theme', value);
      document.documentElement.classList.toggle('dark', value === 'dark');
      document.documentElement.classList.toggle('light', value === 'light');
    }
    setTheme(value as ThemeOption);
  };

  const handleSearchProviderChange = (value: string) => {
    console.log('handleSearchProviderChange', value);
    if (!value) return;
    settingsState.value.podcastSearchProvider = value as PodcastSearchProvider;
  };

  const handleRadioReconnectsValueChange = (e: ChangeEvent<HTMLSelectElement>) => {
    if (!settingsState.value || !e.currentTarget?.value) return;
    settingsState.value.radioStreamMaxReconnects = +e.currentTarget.value;
  };

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
    </div>
  );
};
