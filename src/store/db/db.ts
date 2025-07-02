import { signal } from '@preact/signals';
import { DBSchema, IDBPDatabase, openDB } from 'idb';
import { logState } from '../signals/log';
import { isPlayerMaximized, playerState } from '../signals/player';
import { playlistRules, playlists } from '../signals/playlist';
import { followedPodcasts, recentlyVisitedPodcasts } from '../signals/podcast';
import {
  followedRadioStationIDs,
  radioBrowserStations,
  radioSearchFilters,
  recentlyVisitedRadioStationIDs,
} from '../signals/radio';
import { settingsState } from '../signals/settings';
import {
  LogState,
  PlayerState,
  Playlist,
  PlaylistRule,
  Podcast,
  RadioSearchFilters,
  RadioStation,
  SettingsState,
} from '../types';

export const isDBLoaded = signal(false);

export const dbName = '1tuner';
export const dbVersion = 9;
export const storeName = 'appState';

export enum AppStateKey {
  FollowedPodcasts = 'followedPodcasts',
  RecentlyVisitedPodcasts = 'recentlyVisitedPodcasts',
  RadioBrowserStations = 'radioBrowserStations',
  FollowedRadioStationIDs = 'followedRadioStationIDs',
  RecentlyVisitedRadioStationIDs = 'recentlyVisitedRadioStationIDs',
  RadioSearchFilters = 'radioSearchFilters',
  Playlists = 'playlists',
  PlaylistRules = 'playlistRules',
  PlayerState = 'playerState',
  SettingsState = 'settingsState',
  LogState = 'logState',
  IsPlayerMaximized = 'isPlayerMaximized',
}

type DBData =
  | Podcast[]
  | RadioStation[]
  | Playlist[]
  | PlaylistRule[]
  | string[]
  | LogState[]
  | RadioSearchFilters
  | PlayerState
  | SettingsState
  | boolean
  | null;
interface TunerDB extends DBSchema {
  appState: {
    key: string;
    value: DBData;
  };
}

const dbPromise =
  typeof window !== 'undefined'
    ? openDB<TunerDB>(dbName, dbVersion, {
        upgrade(db) {
          if (!db.objectStoreNames.contains(storeName)) {
            db.createObjectStore(storeName);
          }
        },
      })
    : null;

const getFromDB = async <T>(db: IDBPDatabase<TunerDB> | null, key: AppStateKey): Promise<T | null> => {
  if (!db) return null;
  return (await db.get(storeName, key)) as T | null;
};

export async function loadStateFromDB() {
  if (typeof window === 'undefined') return;
  const db = await dbPromise;
  followedPodcasts.value = (await getFromDB<Podcast[]>(db, AppStateKey.FollowedPodcasts)) || [];
  recentlyVisitedPodcasts.value = (await getFromDB<Podcast[]>(db, AppStateKey.RecentlyVisitedPodcasts)) || [];
  radioBrowserStations.value = (await getFromDB<RadioStation[]>(db, AppStateKey.RadioBrowserStations)) || [];
  followedRadioStationIDs.value = (await getFromDB<string[]>(db, AppStateKey.FollowedRadioStationIDs)) || [];
  recentlyVisitedRadioStationIDs.value =
    (await getFromDB<string[]>(db, AppStateKey.RecentlyVisitedRadioStationIDs)) || [];
  radioSearchFilters.value = (await getFromDB<RadioSearchFilters>(db, AppStateKey.RadioSearchFilters)) || null;
  playlists.value = (await getFromDB<Playlist[]>(db, AppStateKey.Playlists)) || [];
  playlistRules.value = (await getFromDB<PlaylistRule[]>(db, AppStateKey.PlaylistRules)) || [];
  playerState.value = (await getFromDB<PlayerState>(db, AppStateKey.PlayerState)) || null;
  settingsState.value = (await getFromDB<SettingsState>(db, AppStateKey.SettingsState)) || ({} as SettingsState);
  logState.value = (await getFromDB<LogState[]>(db, AppStateKey.LogState)) || [];
  isPlayerMaximized.value = (await getFromDB<boolean>(db, AppStateKey.IsPlayerMaximized)) || false;
  isDBLoaded.value = true;
}

export async function saveStateToDB() {
  if (typeof window === 'undefined') return;
  const db = await dbPromise;
  if (!db) return;

  try {
    const tx = db.transaction(storeName, 'readwrite');
    await Promise.all([
      tx.store.put(followedPodcasts.value, AppStateKey.FollowedPodcasts),
      tx.store.put(recentlyVisitedPodcasts.value, AppStateKey.RecentlyVisitedPodcasts),
      tx.store.put(radioBrowserStations.value, AppStateKey.RadioBrowserStations),
      tx.store.put(followedRadioStationIDs.value, AppStateKey.FollowedRadioStationIDs),
      tx.store.put(recentlyVisitedRadioStationIDs.value, AppStateKey.RecentlyVisitedRadioStationIDs),
      tx.store.put(radioSearchFilters.value, AppStateKey.RadioSearchFilters),
      tx.store.put(playlists.value, AppStateKey.Playlists),
      tx.store.put(playlistRules.value, AppStateKey.PlaylistRules),
      tx.store.put(playerState.value, AppStateKey.PlayerState),
      tx.store.put(settingsState.value, AppStateKey.SettingsState),
      tx.store.put(logState.value, AppStateKey.LogState),
      tx.store.put(isPlayerMaximized.value, AppStateKey.IsPlayerMaximized),
    ]);
    await tx.done;
  } catch (error) {
    console.error('Error saving state to DB:', error);
  }
}

export function useDB() {
  return {
    loadStateFromDB,
    saveStateToDB,
  };
}
