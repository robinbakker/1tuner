import { ThemeToggle } from '~/components/theme-toggle';

export const SettingsPage = () => {
  return (
    <div class="container mx-auto px-8 py-6">
      <h1 class="text-3xl font-bold mb-6">Settings</h1>
      <div class="mb-8 relative">
        <ThemeToggle />
      </div>
    </div>
  );
};
