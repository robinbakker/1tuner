import { useCallback, useState } from 'preact/hooks';
import { validationUtil } from '~/lib/validationUtil';
import { lastRadioSearchResult, RADIO_BROWSER_PARAM_PREFIX, radioLanguages } from '~/store/signals/radio';
import { RadioStation } from '~/store/types';

type RadioBrowserStation = {
  stationuuid: string;
  name: string;
  url: string;
  url_resolved: string;
  favicon: string;
  tags: string;
  countrycode: string;
  codec: string;
  homepage: string;
  lastchangetime_iso8601: string;
};

export const useRadioBrowser = () => {
  const [isLoading, setIsLoading] = useState(false);

  const getMimeType = (codec: string | null | undefined) => {
    switch (codec?.toLowerCase()) {
      case 'mp3':
        return 'audio/mpeg';
      case 'aac':
      case 'aac+':
        return 'audio/aac';
      case 'ogg':
        return 'audio/ogg';
      case 'wma':
        return 'audio/x-ms-wma';
      case 'flac':
        return 'audio/flac';
      case 'hls':
        return 'application/vnd.apple.mpegurl';
      case 'opus':
        return 'audio/ogg; codecs=opus';
      default:
        return 'audio/mpeg'; // Fallback MIME type
    }
  };

  const mapRadioBrowserStation = useCallback((station: RadioBrowserStation, index = 0): RadioStation => {
    const language = radioLanguages.value.find((l) => l.abbr === station.countrycode)?.id || station.countrycode;
    return {
      id: `rb-${station.stationuuid}`,
      stationuuid: station.stationuuid,
      name: station.name,
      logosource: station.favicon,
      streams: [{ url: station.url_resolved, mimetype: getMimeType(station.codec) }],
      displayorder: index + 1,
      language,
      lastChanged: station.lastchangetime_iso8601,
      website: station.homepage,
      genres: station.tags
        .split(',')
        .map((tag) => tag.trim())
        .filter(Boolean),
    };
  }, []);

  const getStation = useCallback(
    async (stationID: string) => {
      const stationuuid = validationUtil.getSanitizedUuid(stationID?.replace(RADIO_BROWSER_PARAM_PREFIX, ''));
      if (!stationuuid || stationuuid.length !== 36) return null;
      const stationFromSearchResult = lastRadioSearchResult.value?.radioBrowserSearchResult?.find(
        (s) => s.stationuuid === stationuuid,
      );
      if (stationFromSearchResult) return stationFromSearchResult;
      setIsLoading(true);
      try {
        const response = await fetch(`${import.meta.env.VITE_RADIO_BROWSER_WORKER_URL}/station`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          body: new URLSearchParams({ uuids: stationuuid }),
        });

        if (!response.ok) {
          throw new Error('Station request failed');
        }

        const data = (await response.json()) as RadioBrowserStation[];
        return data.length > 0 ? mapRadioBrowserStation(data[0]) : null;
      } catch (error) {
        console.error('Error fetching station:', error);
        return null;
      } finally {
        setIsLoading(false);
      }
    },
    [mapRadioBrowserStation],
  );

  const searchStations = useCallback(
    async (query: string) => {
      setIsLoading(true);
      try {
        const response = await fetch(`${import.meta.env.VITE_RADIO_BROWSER_WORKER_URL}/stations`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          body: new URLSearchParams({ name: query }),
        });

        if (!response.ok) {
          throw new Error('Search request failed');
        }

        const data = (await response.json()) as RadioBrowserStation[];

        return data
          .filter((s) => s.favicon && s.favicon !== 'null' && s.url_resolved)
          .map((station, index): RadioStation => mapRadioBrowserStation(station, index));
      } catch (error) {
        console.error('Error fetching stations:', error);
        return [];
      } finally {
        setIsLoading(false);
      }
    },
    [mapRadioBrowserStation],
  );

  const setStationClick = useCallback(async (uuid: string) => {
    if (!uuid) return;
    try {
      fetch(`${import.meta.env.VITE_RADIO_BROWSER_WORKER_URL}/station-click`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({ uuid: uuid }),
      });
    } catch (error) {
      console.error('Error station click:', error);
    }
  }, []);

  return {
    isLoading,
    searchStations,
    getStation,
    setStationClick,
  };
};
