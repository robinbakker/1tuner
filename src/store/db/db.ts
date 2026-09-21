import { batch, effect, signal, Signal } from '@preact/signals';
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
import { equalState, mergeState } from './merge';

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

const stateSignals: Record<AppStateKey, Signal<DBData>> = {
  followedPodcasts,
  recentlyVisitedPodcasts,
  radioBrowserStations,
  followedRadioStationIDs,
  recentlyVisitedRadioStationIDs,
  radioSearchFilters,
  playlists,
  playlistRules,
  playerState,
  settingsState,
  logState,
  isPlayerMaximized,
};
const keys = Object.values(AppStateKey);
type Snapshot = Record<AppStateKey, DBData>;
let baseline: Snapshot;
let operation = Promise.resolve();
let channel: BroadcastChannel | undefined;
let isApplyingSnapshot = false;

function snapshot(): Snapshot {
  return structuredClone(Object.fromEntries(keys.map((key) => [key, stateSignals[key].peek()]))) as Snapshot;
}

function defaultValue(key: AppStateKey): DBData {
  if (key === AppStateKey.PlayerState || key === AppStateKey.RadioSearchFilters) return null;
  if (key === AppStateKey.SettingsState) return {};
  if (key === AppStateKey.IsPlayerMaximized) return false;
  return [];
}

function mergeValue(key: AppStateKey, base: DBData, local: DBData, remote: DBData): DBData {
  // Playback is owned by each tab; never combine fields from different sources.
  if (key === AppStateKey.PlayerState) return equalState(base, local) ? remote : local;
  const merged = mergeState(base, local, remote) as DBData;
  if (Array.isArray(merged)) {
    if (key === AppStateKey.RecentlyVisitedPodcasts || key === AppStateKey.RecentlyVisitedRadioStationIDs) {
      return merged.slice(0, 10) as DBData;
    }
    if (key === AppStateKey.LogState) return merged.slice(-200) as LogState[];
  }
  return merged;
}

function enqueue(action: () => Promise<void>) {
  operation = operation.then(action).catch((error) => console.error('Error saving/syncing state to DB:', error));
  return operation;
}

function applyCommittedState(previous: Snapshot, committed: Snapshot) {
  const current = snapshot();
  isApplyingSnapshot = true;
  try {
    batch(() => {
      for (const key of keys) {
        // A remote save must not start/stop audio or change this tab's player UI.
        // Keep a local baseline for these values so an idle tab never writes them back.
        if (key === AppStateKey.PlayerState || key === AppStateKey.IsPlayerMaximized) {
          baseline[key] = previous[key];
          continue;
        }
        const value = mergeValue(key, previous[key], current[key], committed[key]);
        baseline[key] = structuredClone(committed[key]);
        if (!equalState(current[key], value)) stateSignals[key].value = value;
      }
    });
  } finally {
    isApplyingSnapshot = false;
  }
}

async function refreshStateFromDB() {
  if (!isDBLoaded.peek()) return;
  const db = await openStateDB();
  const tx = db.transaction(storeName, 'readonly');
  const [values] = await Promise.all([Promise.all(keys.map((key) => tx.store.get(key))), tx.done]);
  const committed = Object.fromEntries(keys.map((key, i) => [key, values[i] ?? defaultValue(key)])) as Snapshot;
  applyCommittedState(baseline, committed);
}

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
    baseline = snapshot();
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
  if (typeof BroadcastChannel !== 'undefined') {
    channel = new BroadcastChannel('1tuner-state');
    channel.onmessage = () => void enqueue(refreshStateFromDB);
  }
  const refresh = () => void enqueue(refreshStateFromDB);
  window.addEventListener('focus', refresh);
  window.addEventListener('pageshow', refresh);
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
    if (hasLoadedSnapshot && !isSnapshottingPlayback && !isApplyingSnapshot && saveTimer === undefined) {
      // Bound the delay even during continuous edits; group a burst into one transaction.
      saveTimer = setTimeout(() => void saveStateToDB(), 100);
    }
    hasLoadedSnapshot = true;
  });
  return () => {
    dispose();
    cancelScheduledSave();
    channel?.close();
    channel = undefined;
    window.removeEventListener('focus', refresh);
    window.removeEventListener('pageshow', refresh);
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
    await enqueue(async () => {
      const db = await openStateDB();
      const local = snapshot();
      const dirtyKeys = keys.filter((key) => !equalState(baseline[key], local[key]));
      if (!dirtyKeys.length) return;
      const committed = structuredClone(baseline);
      // Read and merge under the same exclusive write transaction. Notifications
      // only refresh the UI; correctness does not depend on their delivery.
      const tx = db.transaction(storeName, 'readwrite');
      let wrote = false;
      await Promise.all([
        tx.done,
        ...dirtyKeys.map(async (key) => {
          const remote = (await tx.store.get(key)) ?? defaultValue(key);
          const merged = mergeValue(key, baseline[key], local[key], remote);
          committed[key] = merged;
          if (!equalState(remote, merged)) {
            await tx.store.put(merged, key);
            wrote = true;
          }
        }),
      ]);
      // Preserve edits made while this transaction was awaiting completion.
      applyCommittedState(local, committed);
      if (wrote) channel?.postMessage('saved');
    });
  } catch (error) {
    console.error('Error saving state to DB:', error);
  }
}
