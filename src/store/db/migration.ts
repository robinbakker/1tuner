import { DBSchema, openDB } from 'idb';
import { playlistUtil } from '~/lib/playlistUtil';
import { getPodcastUrlID } from '~/lib/utils';
import { hasAppUpdatedMessage } from '../signals/ui';
import { Podcast } from '../types';
import { AppStateKey, dbName, dbVersion, storeName } from './db';

interface OldKeyvalStore extends DBSchema {
  keyval: {
    key: string;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    value: any;
  };
}

interface OldPodcastEpisode {
  title: string;
  description?: string;
  duration: string;
  durationSeconds?: number;
  secondsElapsed?: number;
  pubDate: string;
  length?: string;
  type?: string;
  url: string;
}

interface OldStation {
  id: string;
}

interface OldPlaylist {
  name: string;
  href: string;
}

interface OldPodcast {
  name: string;
  logo: string;
  language?: string;
  description?: string;
  feedUrl: string;
  modified: Date;
  episodes?: OldPodcastEpisode[];
}

export async function migrateOldData() {
  try {
    // First check if old database exists
    const databases = await window.indexedDB.databases();
    const oldDbExists = databases.some((db) => db.name === 'keyval-store');

    if (!oldDbExists) {
      console.log('No old database found, skipping migration');
      return;
    }

    hasAppUpdatedMessage.value = true;

    // Open old database
    const oldDb = await openDB<OldKeyvalStore>('keyval-store', 1, {
      blocked() {
        console.log('Old database blocked');
      },
    });

    if (!oldDb) {
      console.log('No old database found, skipping migration');
      return;
    }

    // Verify the required store exists
    if (!oldDb.objectStoreNames.contains('keyval')) {
      console.log('Old database structure invalid, skipping migration');
      oldDb.close();
      return;
    }

    // Check if already migrated
    const migrationInfo = await oldDb.get('keyval', 'migration-info');
    if (migrationInfo?.migrated) {
      console.log('Data already migrated on', migrationInfo.migrationDate);
      oldDb.close();
      return;
    }

    // Open new database (reuse existing configuration)
    const newDb = await openDB(dbName, dbVersion, {
      blocked() {
        console.log('New database blocked');
      },
    });

    // Migrate radio stations
    const lastStationList = (await oldDb.get('keyval', 'last-station-list')) as OldStation[];
    if (lastStationList?.length > 0) {
      console.log('Migrating radio station data...');
      const stationIds = lastStationList.map((station) => station.id);
      await newDb.put(storeName, stationIds, AppStateKey.RecentlyVisitedRadioStationIDs);
    }

    // Migrate podcasts
    const oldPodcastList = (await oldDb.get('keyval', 'podcast-list')) as OldPodcast[];
    if (oldPodcastList?.length > 0) {
      console.log('Migrating podcast data...');

      // Sort podcasts by modified date (newest first)
      const sortedPodcasts = [...oldPodcastList].sort(
        (a, b) => new Date(b.modified).getTime() - new Date(a.modified).getTime(),
      );

      const migratedPodcasts = sortedPodcasts.map(
        (podcast) =>
          ({
            id: getPodcastUrlID(podcast.feedUrl),
            title: podcast.name,
            feedUrl: podcast.feedUrl,
            url: podcast.feedUrl,
            imageUrl: podcast.logo,
            addedDate: new Date(podcast.modified).getTime(),
            description: podcast.description || '',
            episodes: podcast.episodes?.map((episode) => ({
              title: episode.title,
              description: episode.description,
              pubDate: new Date(episode.pubDate),
              duration: episode.duration,
              audio: episode.url,
              mimeType: episode.type,
              currentTime: episode.secondsElapsed,
            })),
          }) as Podcast,
      );

      await newDb.put(storeName, migratedPodcasts, AppStateKey.RecentlyVisitedPodcasts);
    }

    // Migrate playlists
    const oldPlaylists = (await oldDb.get('keyval', 'playlists')) as OldPlaylist[];
    if (oldPlaylists?.length > 0) {
      console.log('Migrating playlists...');
      const migratedPlaylists = oldPlaylists.map((pl) => playlistUtil.getPlaylistDataByUrl(pl.href)).filter(Boolean);
      if (migratedPlaylists.length) {
        await newDb.put(storeName, migratedPlaylists, AppStateKey.Playlists);
      }
    }

    // Mark old database as migrated
    await oldDb.put(
      'keyval',
      {
        migrated: true,
        migrationDate: new Date().toISOString(),
        version: '2.0',
      },
      'migration-info',
    );

    oldDb.close();
    newDb.close();

    console.log('Migration completed successfully');
  } catch (error) {
    console.error('Migration failed:', error);
  }
}
