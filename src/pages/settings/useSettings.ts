import { ChangeEvent } from 'preact/compat';
import { useEffect } from 'preact/hooks';
import { RadioButtonListOption } from '~/components/ui/radio-button-list';
import { settingsState } from '~/store/signals/settings';
import { uiState } from '~/store/signals/ui';
import { PodcastSearchProvider } from '~/store/types';
import { ThemeOption } from './types';

export const useSettings = () => {
  const themeOptions: RadioButtonListOption[] = [
    { label: 'System default', value: 'default' },
    { label: 'Light', value: 'light' },
    { label: 'Dark', value: 'dark' },
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
    settingsState.value.theme = value as ThemeOption;
    if (value === 'default') {
      window?.localStorage.removeItem('theme');
      document.documentElement.classList.remove('dark', 'light');
    } else {
      window?.localStorage.setItem('theme', value);
      document.documentElement.classList.toggle('dark', value === 'dark');
      document.documentElement.classList.toggle('light', value === 'light');
    }
  };

  const handleSearchProviderChange = (value: string) => {
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

  const handleResetClick = async () => {
    if (
      confirm(
        'Are you sure you want to reset all your settings and listening data? Please note: you cannot reverse this action.',
      )
    ) {
      localStorage.clear();

      // Clear IndexedDB
      const dbs = await window.indexedDB.databases();
      dbs.forEach((db) => {
        if (db.name) {
          window.indexedDB.deleteDatabase(db.name);
        }
      });

      // Unregister service worker
      if ('serviceWorker' in navigator) {
        const registrations = await navigator.serviceWorker.getRegistrations();
        for (const registration of registrations) {
          await registration.unregister();
        }
      }

      // Reload page
      window.location.reload();
    }
  };

  useEffect(() => {
    uiState.value = { ...uiState.value, headerTitle: 'Settings' };
    return () => (uiState.value = { ...uiState.value, headerTitle: '' });
  });

  return {
    handleRadioReconnectsValueChange,
    handleSearchProviderChange,
    handleThemeChange,
    handleGoogleCastSupportChange,
    handleResetClick,
    searchProviderOptions,
    themeOptions,
    theme: settingsState.value.theme ?? 'default',
    searchProviderValue: settingsState.value.podcastSearchProvider ?? PodcastSearchProvider.PodcastIndex,
    radioStreamMaxReconnectsValue: settingsState.value.radioStreamMaxReconnects ?? 50,
    hasGoogleCastsSupport: !!settingsState.value.enableChromecast,
  };
};
