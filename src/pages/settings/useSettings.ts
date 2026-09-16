import { ChangeEvent } from 'preact/compat';
import { useCallback, useEffect, useState } from 'preact/hooks';
import { RadioButtonListOption } from '~/components/ui/radio-button-list';
import { useHead } from '~/hooks/useHead';
import { usePodcastData } from '~/hooks/usePodcastData';
import { opmlUtil } from '~/lib/opmlUtil';
import { delay, getPodcastUrlID } from '~/lib/utils';
import { isDBLoaded } from '~/store/db/db';
import { updateSettings } from '~/store/settings';
import { logDays, logState } from '~/store/signals/log';
import { addFollowedPodcast, followedPodcasts, isFollowedPodcast } from '~/store/signals/podcast';
import { DEFAULT_MAX_RECONNECT_ATTEMPTS, settingsState } from '~/store/signals/settings';
import { uiState } from '~/store/signals/ui';
import { PodcastSearchProvider } from '~/store/types';
import { ThemeOption } from './types';

export const useSettings = () => {
  const { fetchPodcastData } = usePodcastData();
  const [isImporting, setIsImporting] = useState(false);
  const [selectedLogDay, setSelectedLogDay] = useState<string | null>(null);
  const themeOptions: RadioButtonListOption[] = [
    { label: 'System default', value: 'default' },
    { label: 'Light', value: 'light' },
    { label: 'Dark', value: 'dark' },
  ];

  useHead({
    title: 'Settings',
  });

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
    updateSettings({ theme: value as ThemeOption });
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
    updateSettings({ podcastSearchProvider: value as PodcastSearchProvider });
  };

  const handleAutomaticRadioReconnect = (e: MouseEvent) => {
    const input = e.currentTarget as HTMLInputElement;
    updateSettings({ radioStreamMaxReconnects: input.checked ? DEFAULT_MAX_RECONNECT_ATTEMPTS : 0 });
  };

  const handleGoogleCastSupportChange = (e: MouseEvent) => {
    const input = e.currentTarget as HTMLInputElement;
    updateSettings({ enableChromecast: input.checked });
  };

  const handleMuteNoiseChange = (e: MouseEvent) => {
    const input = e.currentTarget as HTMLInputElement;
    updateSettings({ disableReconnectNoise: input.checked });
  };

  const handleEnableLoggingChange = (e: MouseEvent) => {
    const input = e.currentTarget as HTMLInputElement;
    updateSettings({ enableLogging: input.checked });
  };

  const handleExportOpml = useCallback(async () => {
    const opml = opmlUtil.generatePodcastsOpml(followedPodcasts.value);
    const blob = new Blob([opml], { type: 'text/x-opml' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = '1tuner-export.opml';

    // Instead of appending to body, just click it
    a.style.display = 'none';
    a.click();

    // Clean up by revoking the blob URL
    setTimeout(() => {
      URL.revokeObjectURL(url);
    }, 100);
  }, [followedPodcasts.value]);

  const handleImportOpml = useCallback(
    async (e: Event) => {
      const input = e.target as HTMLInputElement;
      const file = input.files?.[0];
      if (!file) return;

      const maxFileSizeMB = 2;
      const maxInputSize = maxFileSizeMB * 1024 * 1024;
      if (file.size > maxInputSize) {
        alert(`File is too large. Maximum size is ${maxFileSizeMB}MB.`);
        input.value = '';
        return;
      }

      setIsImporting(true);
      try {
        const text = await file.text();
        const feedUrls = opmlUtil.parsePodcastFeedUrls(text);
        const seen = new Set<string>();
        let imported = 0;
        let skipped = 0;
        let failed = 0;

        for (const feedUrl of feedUrls) {
          try {
            // Validate without rewriting the scheme, path, or query of the feed.
            const url = new URL(feedUrl);
            if (url.protocol !== 'http:' && url.protocol !== 'https:') {
              throw new Error('Unsupported feed URL');
            }
            const id = getPodcastUrlID(feedUrl);
            if (seen.has(id) || isFollowedPodcast(id)) {
              skipped++;
              continue;
            }
            seen.add(id);
            const podcast = await fetchPodcastData(id, feedUrl);
            if (!podcast) {
              failed++;
            } else if (addFollowedPodcast(podcast)) {
              imported++;
            } else {
              skipped++;
            }
            await delay(500);
          } catch (error) {
            console.error('Failed to import podcast:', error);
            failed++;
          }
        }
        alert(`Import completed: ${imported} imported, ${skipped} skipped, ${failed} failed.`);
      } catch (error) {
        console.error('Import failed:', error);
        alert('Failed to import OPML file. Please check the file format.');
      } finally {
        // Clear the input
        input.value = '';
        setIsImporting(false);
      }
    },
    [fetchPodcastData],
  );

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

  const handleLogDayChange = (e: ChangeEvent<HTMLSelectElement>) => {
    const day = e.currentTarget.value || null;
    if (!day || day === selectedLogDay) return;
    setSelectedLogDay(day);
  };

  const handleCopyLogs = () => {
    navigator.clipboard.writeText(
      JSON.stringify(
        logState.value.filter((entry) => entry.timestamp.toISOString().startsWith(selectedLogDay ?? '')),
        null,
        2,
      ),
    );
  };

  useEffect(() => {
    if (logDays.value.length > 0) {
      setSelectedLogDay(logDays.value[0]);
    }
  }, [logDays.value]);

  useEffect(() => {
    if (!isDBLoaded.value) return;
    const previousState = { ...uiState.value };
    uiState.value = { ...previousState, headerTitle: 'Settings' };
    return () => (uiState.value = { ...previousState, headerTitle: '' });
  }, [isDBLoaded.value]);

  return {
    handleAutomaticRadioReconnect,
    handleSearchProviderChange,
    handleThemeChange,
    handleGoogleCastSupportChange,
    handleMuteNoiseChange,
    handleEnableLoggingChange,
    handleResetClick,
    handleExportOpml,
    handleImportOpml,
    isImporting,
    searchProviderOptions,
    themeOptions,
    theme: settingsState.value.theme ?? 'default',
    searchProviderValue: settingsState.value.podcastSearchProvider ?? PodcastSearchProvider.PodcastIndex,
    radioStreamMaxReconnectsValue: settingsState.value.radioStreamMaxReconnects ?? 50,
    hasGoogleCastsSupport: !!settingsState.value.enableChromecast,
    hasNoiseMuted: !!settingsState.value.disableReconnectNoise,
    isLoggingEnabled: !!settingsState.value.enableLogging,
    selectedLogDay,
    handleLogDayChange,
    handleCopyLogs,
  };
};
