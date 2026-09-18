import { batch, effect, signal } from '@preact/signals';
import { DBSchema, IDBPDatabase, openDB } from 'idb';
import { snapshotPlaybackProgress } from '../playbackProgress';
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

let dbPromise: Promise<IDBPDatabase<TunerDB>> | undefined;

export function openStateDB() {
  if (!dbPromise) {
    dbPromise = openDB<TunerDB>(dbName, dbVersion, {
      upgrade(db) {
        if (!db.objectStoreNames.contains(storeName)) {
          db.createObjectStore(storeName);
        }
      },
    }).catch((error) => {
      dbPromise = undefined;
      throw error;
    });
  }
  return dbPromise;
}

export async function loadStateFromDB() {
  if (typeof window === 'undefined') return;
  const db = await openStateDB();
  const tx = db.transaction(storeName, 'readonly');
  // Read one consistent snapshot and leave signals untouched if any read fails.
  const keys = Object.values(AppStateKey);
  const [values] = await Promise.all([Promise.all(keys.map((key) => tx.store.get(key))), tx.done]);
  const data = new Map(keys.map((key, index) => [key, values[index]]));
  batch(() => {
    followedPodcasts.value = (data.get(AppStateKey.FollowedPodcasts) as Podcast[]) || [];
    recentlyVisitedPodcasts.value = (data.get(AppStateKey.RecentlyVisitedPodcasts) as Podcast[]) || [];
    radioBrowserStations.value = (data.get(AppStateKey.RadioBrowserStations) as RadioStation[]) || [];
    followedRadioStationIDs.value = (data.get(AppStateKey.FollowedRadioStationIDs) as string[]) || [];
    recentlyVisitedRadioStationIDs.value = (data.get(AppStateKey.RecentlyVisitedRadioStationIDs) as string[]) || [];
    radioSearchFilters.value = (data.get(AppStateKey.RadioSearchFilters) as RadioSearchFilters) || null;
    playlists.value = (data.get(AppStateKey.Playlists) as Playlist[]) || [];
    playlistRules.value = (data.get(AppStateKey.PlaylistRules) as PlaylistRule[]) || [];
    playerState.value = (data.get(AppStateKey.PlayerState) as PlayerState) || null;
    settingsState.value = (data.get(AppStateKey.SettingsState) as SettingsState) || ({} as SettingsState);
    logState.value = (data.get(AppStateKey.LogState) as LogState[]) || [];
    isPlayerMaximized.value = (data.get(AppStateKey.IsPlayerMaximized) as boolean) || false;
    isDBLoaded.value = true;
  });
}

let saveTimer: ReturnType<typeof setTimeout> | undefined;
let isSnapshottingPlayback = false;

function cancelScheduledSave() {
  clearTimeout(saveTimer);
  saveTimer = undefined;
}

export function startStatePersistence() {
  let hasLoadedSnapshot = false;
  const dispose = effect(() => {
    if (!isDBLoaded.value) return;
    // Playback and logs retain their existing checkpoint/lifecycle saves.
    void followedPodcasts.value;
    void recentlyVisitedPodcasts.value;
    void radioBrowserStations.value;
    void followedRadioStationIDs.value;
    void recentlyVisitedRadioStationIDs.value;
    void radioSearchFilters.value;
    void playlists.value;
    void playlistRules.value;
    void settingsState.value;
    void isPlayerMaximized.value;
    if (hasLoadedSnapshot && !isSnapshottingPlayback && saveTimer === undefined) {
      // Bound the delay even during continuous edits; group a burst into one transaction.
      saveTimer = setTimeout(() => void saveStateToDB(), 100);
    }
    hasLoadedSnapshot = true;
  });
  return () => {
    dispose();
    cancelScheduledSave();
  };
}

export async function saveStateToDB() {
  if (typeof window === 'undefined' || !isDBLoaded.peek()) return;
  cancelScheduledSave();
  try {
    // Snapshot updates are included in this write; they must not schedule another save.
    isSnapshottingPlayback = true;
    try {
      snapshotPlaybackProgress();
    } finally {
      isSnapshottingPlayback = false;
    }
    const db = await openStateDB();
    const tx = db.transaction(storeName, 'readwrite');
    await Promise.all([
      tx.done,
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
  } catch (error) {
    console.error('Error saving state to DB:', error);
  }
}
