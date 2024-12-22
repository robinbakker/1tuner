import { useState } from 'preact/hooks';

type ThemeOption = 'default' | 'light' | 'dark';

export const SettingsPage = () => {
  const [theme, setTheme] = useState<ThemeOption>(window.localStorage.theme ?? 'default');

  const handleThemeChange = (event: { target: { value: string } }) => {
    if (event.target.value === 'default') {
      window.localStorage.removeItem('theme');
      document.documentElement.classList.remove('dark', 'light');
    } else {
      window.localStorage.setItem('theme', event.target.value);
      document.documentElement.classList.toggle('dark', event.target.value === 'dark');
      document.documentElement.classList.toggle('light', event.target.value === 'light');
    }
    setTheme(event.target.value as ThemeOption);
  };

  return (
    <div class="container mx-auto px-8 py-6">
      <h1 class="text-3xl font-bold mb-6">Settings</h1>
      <div class="mb-8 relative">
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
                checked={theme === 'default'}
                onClick={handleThemeChange}
              />{' '}
              System default
            </label>
          </li>
        </ul>
      </div>
    </div>
  );
};
