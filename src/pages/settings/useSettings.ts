import { ChangeEvent } from 'preact/compat';
import { useState } from 'preact/hooks';
import { RadioButtonListOption } from '~/components/ui/radio-button-list';
import { useHead } from '~/hooks/useHead';
import { settingsState } from '~/store/signals/settings';
import { PodcastSearchProvider } from '~/store/types';
import { ThemeOption } from './types';

export const useSettings = () => {
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

  useHead({
    title: 'Settings',
  });

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

  const handleGoogleCastSupportChange = (e: MouseEvent) => {
    if (!settingsState.value) return;
    const input = e.currentTarget as HTMLInputElement;
    settingsState.value.enableChromecast = input.checked;
  };

  return {
    handleRadioReconnectsValueChange,
    handleSearchProviderChange,
    handleThemeChange,
    handleGoogleCastSupportChange,
    searchProviderOptions,
    themeOptions,
    theme,
  };
};
