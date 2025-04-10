import { ArrowRightFromLine, Download, LoaderCircle, TriangleAlert } from 'lucide-preact';
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
    hasNoiseMuted,
    hasGoogleCastsSupport,
    isImporting,
    handleThemeChange,
    handleSearchProviderChange,
    handleAutomaticRadioReconnect,
    handleMuteNoiseChange,
    handleGoogleCastSupportChange,
    handleExportOpml,
    handleImportOpml,
    handleResetClick,
  } = useSettings();

  return (
    <div class="container mx-auto px-8 pb-6">
      <h1 class="text-3xl font-bold mb-6">Settings</h1>
      <p class="pb-4">
        This app stores information in your browser to save your preferences and Cloudflare Web Analytics is used for
        basic analytics. Below you can change settings and manage your data.
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
        <p class="text-muted-foreground text-sm mb-4">Just like Star Wars - choose your theme preference wisely.</p>
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
          When switching from networks (e.g. going from wifi to cellular), the radio stream may be interrupted and the
          app will try to reconnect automatically. This setting allows you to opt-out of automatic reconnects.
        </p>
        <Switch
          checked={radioStreamMaxReconnectsValue > 0}
          onClick={handleAutomaticRadioReconnect}
          label="Reconnect automatically"
        />
        {radioStreamMaxReconnectsValue > 0 && (
          <>
            <p class="text-muted-foreground text-sm my-4">
              When reconnecting, a bit of noise will be played to let you know the player is trying to reconnect. Don't
              want to hear the noise? Flip the switch below.
            </p>
            <Switch checked={hasNoiseMuted} onClick={handleMuteNoiseChange} label="Mute noise" />
          </>
        )}
      </section>
      <section class="mb-8 relative">
        <h2 class="text-2xl font-semibold">Google Cast (Chromecast) support (experimental)</h2>
        <p class="text-muted-foreground text-sm mb-4">
          Enable this option to support playing to a Chromecast or Google Cast enabled device (this is behind a toggle
          because it loads an extra external script from gstatic.com, and the functionalaity is still experimental).
        </p>
        <p>
          <Switch
            checked={hasGoogleCastsSupport}
            onClick={handleGoogleCastSupportChange}
            label="Enable Google Cast support"
          />
        </p>
      </section>
      <section class="mb-8 relative">
        <h2 class="text-2xl font-semibold">Import/Export</h2>
        <p class="text-muted-foreground text-sm mb-4">
          Export your followed podcasts to an OPML file (which can be imported into other podcast apps), or import from
          an OPML file.
        </p>
        <div class="flex gap-4 items-center">
          <div class="relative">
            <input
              type="file"
              accept=".opml,.xml"
              onChange={handleImportOpml}
              class="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            />
            <Button disabled={isImporting} variant="outline">
              <Download class="mr-2 w-4" /> Import from OPML
            </Button>
          </div>
          <Button disabled={isImporting} variant="outline" onClick={handleExportOpml}>
            <ArrowRightFromLine class="mr-2 w-4" /> Export to OPML
          </Button>
          <LoaderCircle class={`w-5 h-5 ${isImporting ? 'animate-spin' : 'hidden'}`} />
        </div>
      </section>
      <section class="mb-8 relative">
        <h2 class="text-2xl font-semibold">Reset</h2>
        <p class="text-muted-foreground text-sm mb-4">
          The following button will reset all your settings and remove listening data. It means that all data will be
          reset to their defaults. No way back.
        </p>
        <Button variant={'outline'} onClick={handleResetClick}>
          <TriangleAlert class="mr-2 w-4 opacity-50" /> Reset
        </Button>
      </section>
      <p class="text-muted-foreground text-sm">v{APP_VERSION}</p>
    </div>
  );
};
