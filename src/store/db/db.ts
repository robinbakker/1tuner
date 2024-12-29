import { DBSchema, IDBPDatabase, openDB } from 'idb';
import { playerState } from '../signals/player';
import { followedPodcasts, recentlyVisitedPodcasts } from '../signals/podcast';
import { followedRadioStationIDs, recentlyVisitedRadioStationIDs } from '../signals/radio';
import { settingsState } from '../signals/settings';
import { PlayerState, Podcast, SettingsState } from '../types';

enum StoreName {
  FollowedPodcasts = 'followedPodcasts',
  RecentlyVisitedPodcasts = 'recentlyVisitedPodcasts',
  FollowedRadioStationIDs = 'followedRadioStationIDs',
  RecentlyVisitedRadioStationIDs = 'recentlyVisitedRadioStationIDs',
  PlayerState = 'playerState',
  SettingsState = 'settingsState',
}

type DBData = Podcast[] | string[] | PlayerState | SettingsState | null;
interface TunerDB extends DBSchema {
  followedPodcasts: {
    key: StoreName.FollowedPodcasts;
    value: Podcast[];
  };
  recentlyVisitedPodcasts: {
    key: StoreName.RecentlyVisitedPodcasts;
    value: Podcast[];
  };
  followedRadioStationIDs: {
    key: StoreName.FollowedRadioStationIDs;
    value: string[];
  };
  recentlyVisitedRadioStationIDs: {
    key: StoreName.RecentlyVisitedRadioStationIDs;
    value: string[];
  };
  playerState: {
    key: StoreName.PlayerState;
    value: PlayerState | null;
  };
  settingsState: {
    key: StoreName.SettingsState;
    value: SettingsState | null;
  };
}

const dbPromise =
  typeof window !== 'undefined'
    ? openDB<TunerDB>('1tuner', 2, {
        upgrade(db) {
          const stores = Object.values(StoreName) as StoreName[];

          // Only create stores that don't exist
          stores.forEach((storeName) => {
            if (!db.objectStoreNames.contains(storeName)) {
              db.createObjectStore(storeName);
            }
          });
        },
      })
    : null;

const getFromDB = async <T>(db: IDBPDatabase<TunerDB> | null, storeName: StoreName): Promise<T | null> => {
  if (!db) return null;
  const storeNames = db.objectStoreNames ? [...db.objectStoreNames] : [];
  if (!storeNames.includes(storeName)) {
    return null;
  }
  return (await db.get(storeName, storeName)) as T | null;
};

export async function loadStateFromDB() {
  if (typeof window === 'undefined') return;
  const db = await dbPromise;
  const dbFollowedPodcasts = (await getFromDB<Podcast[]>(db, StoreName.FollowedPodcasts)) || [];
  const dbRecentlyVisitedPodcasts = (await getFromDB<Podcast[]>(db, StoreName.RecentlyVisitedPodcasts)) || [];
  const dbFollowedRadioStationIDs = (await getFromDB<string[]>(db, StoreName.FollowedRadioStationIDs)) || [];
  const dbRecentlyVisitedRadioStationIDs =
    (await getFromDB<string[]>(db, StoreName.RecentlyVisitedRadioStationIDs)) || [];
  const dbPlayerState = (await getFromDB<PlayerState>(db, StoreName.PlayerState)) || null;
  const dbSettingsState = (await getFromDB<SettingsState>(db, StoreName.SettingsState)) || ({} as SettingsState);
  followedPodcasts.value = dbFollowedPodcasts;
  recentlyVisitedPodcasts.value = dbRecentlyVisitedPodcasts;
  followedRadioStationIDs.value = dbFollowedRadioStationIDs;
  recentlyVisitedRadioStationIDs.value = dbRecentlyVisitedRadioStationIDs;
  playerState.value = dbPlayerState;
  settingsState.value = dbSettingsState;
}

const putToDB = async (db: IDBPDatabase<TunerDB> | null, storeName: StoreName, data: DBData): Promise<void> => {
  if (!db) return;
  await db.put(storeName, data, storeName);
};

export async function saveStateToDB() {
  if (typeof window === 'undefined') return;
  const db = await dbPromise;
  await putToDB(db, StoreName.FollowedPodcasts, followedPodcasts.value);
  await putToDB(db, StoreName.RecentlyVisitedPodcasts, recentlyVisitedPodcasts.value);
  await putToDB(db, StoreName.FollowedRadioStationIDs, followedRadioStationIDs.value);
  await putToDB(db, StoreName.RecentlyVisitedRadioStationIDs, recentlyVisitedRadioStationIDs.value);
  await putToDB(db, StoreName.PlayerState, playerState.value);
  await putToDB(db, StoreName.SettingsState, settingsState.value);
}

export function useDB() {
  return {
    loadStateFromDB,
    saveStateToDB,
  };
}
