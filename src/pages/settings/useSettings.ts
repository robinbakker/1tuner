import { XMLParser } from 'fast-xml-parser';
import { ChangeEvent } from 'preact/compat';
import { useCallback, useEffect, useState } from 'preact/hooks';
import { RadioButtonListOption } from '~/components/ui/radio-button-list';
import { usePodcastData } from '~/hooks/usePodcastData';
import { opmlUtil } from '~/lib/opmlUtil';
import { delay, getPodcastUrlID, normalizedUrlWithoutScheme } from '~/lib/utils';
import { followedPodcasts, followPodcast } from '~/store/signals/podcast';
import { settingsState } from '~/store/signals/settings';
import { uiState } from '~/store/signals/ui';
import { Podcast, PodcastSearchProvider } from '~/store/types';
import { ThemeOption } from './types';

export const useSettings = () => {
  const { fetchPodcastData } = usePodcastData();
  const [isImporting, setIsImporting] = useState(false);
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
      setIsImporting(true);
      try {
        const text = await file.text();
        const parser = new XMLParser({
          ignoreAttributes: false,
          attributeNamePrefix: '@_',
        });

        const result = parser.parse(text);
        const outlines = result.opml?.body?.outline;

        if (!outlines) {
          throw new Error('No valid outlines found in OPML file');
        }

        // Handle both single outline and array of outlines
        interface OutlineItem {
          '@_text'?: string;
          '@_type'?: string;
          '@_xmlUrl'?: string;
          outline?: OutlineItem[]; // Recursive type for nested outlines
        }

        const podcasts: Podcast[] = [];
        const podcastIDUrls: { id: string; feedUrl: string }[] = [];

        const processOutlines = async (items: OutlineItem | OutlineItem[]) => {
          // If it's a podcasts category
          if (!Array.isArray(items) && Array.isArray(items.outline)) {
            for (const outline of items.outline) {
              if (outline['@_type'] === 'rss' && outline['@_xmlUrl']) {
                const feedUrl = `https://${normalizedUrlWithoutScheme(outline['@_xmlUrl'])}`;
                const id = getPodcastUrlID(outline['@_xmlUrl']);
                podcastIDUrls.push({ id, feedUrl });
              }
            }
          } else if (Array.isArray(items)) {
            for (const item of items) {
              await processOutlines(item);
            }
          }
        };

        await processOutlines(outlines);
        for (const p of podcastIDUrls) {
          const podcast = await fetchPodcastData(p.id, p.feedUrl);
          await delay(500);
          if (podcast) {
            followPodcast({ ...podcast });
            podcasts.push(podcast);
          }
        }
        // Save podcasts to local storage or state as needed
        console.log('Imported podcasts:', podcastIDUrls, podcasts);
        alert('Import completed successfully!');
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
    handleExportOpml,
    handleImportOpml,
    isImporting,
    searchProviderOptions,
    themeOptions,
    theme: settingsState.value.theme ?? 'default',
    searchProviderValue: settingsState.value.podcastSearchProvider ?? PodcastSearchProvider.PodcastIndex,
    radioStreamMaxReconnectsValue: settingsState.value.radioStreamMaxReconnects ?? 50,
    hasGoogleCastsSupport: !!settingsState.value.enableChromecast,
  };
};
