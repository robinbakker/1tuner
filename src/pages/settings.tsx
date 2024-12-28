import { useState } from 'preact/hooks';
import { settingsState } from '~/store/signals/settings';
import { PodcastSearchProvider } from '~/store/types';

type ThemeOption = 'default' | 'light' | 'dark';

export const SettingsPage = () => {
  const [theme, setTheme] = useState<ThemeOption>(
    typeof window !== 'undefined' ? window?.localStorage.theme : 'default',
  );

  const handleThemeChange = (e: MouseEvent) => {
    const target = e.target as HTMLInputElement;
    if (target.value === 'default') {
      window?.localStorage.removeItem('theme');
      document.documentElement.classList.remove('dark', 'light');
    } else {
      window?.localStorage.setItem('theme', target.value);
      document.documentElement.classList.toggle('dark', target.value === 'dark');
      document.documentElement.classList.toggle('light', target.value === 'light');
    }
    setTheme(target.value as ThemeOption);
  };

  const handleSearchProviderChange = (e: MouseEvent) => {
    if (!settingsState.value) return;
    const target = e.target as HTMLInputElement;
    settingsState.value.podcastSearchProvider = target.value as PodcastSearchProvider;
  };

  return (
    <div class="container mx-auto px-8 py-6">
      <h1 class="text-3xl font-bold mb-6">Settings</h1>
      <section class="mb-8 relative">
        <h2 class="text-2xl font-semibold mb-4">Theme</h2>
        <ul>
          <li>
            <label>
              <input type="radio" name="theme" value="light" checked={theme === 'light'} onClick={handleThemeChange} />{' '}
              Light
            </label>
          </li>
          <li>
            <label>
              <input type="radio" name="theme" value="dark" checked={theme === 'dark'} onClick={handleThemeChange} />{' '}
              Dark
            </label>
          </li>
          <li>
            <label>
              <input
                type="radio"
                name="theme"
                value="default"
                checked={!theme || theme === 'default'}
                onClick={handleThemeChange}
              />{' '}
              System default
            </label>
          </li>
        </ul>
      </section>
      <section class="mb-8 relative">
        <h2 class="text-2xl font-semibold mb-4">Podcast search provider</h2>
        <ul>
          <li>
            <label>
              <input
                type="radio"
                name="searchProvider"
                value={PodcastSearchProvider.PodcastIndex}
                checked={settingsState.value?.podcastSearchProvider === PodcastSearchProvider.PodcastIndex}
                onClick={handleSearchProviderChange}
              />{' '}
              PodcastIndex.org
            </label>
          </li>
          <li>
            <label>
              <input
                type="radio"
                name="searchProvider"
                value={PodcastSearchProvider.Apple}
                checked={settingsState.value?.podcastSearchProvider === PodcastSearchProvider.Apple}
                onClick={handleSearchProviderChange}
              />{' '}
              Apple iTunes Search
            </label>
          </li>
        </ul>
      </section>
    </div>
  );
};
