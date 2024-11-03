import { DBSchema, openDB } from 'idb';
import { followedPodcasts, recentlyVisitedPodcasts } from '../signals/podcast';
import { followedRadioStationIDs, recentlyVisitedRadioStationIDs } from '../signals/radio';

export interface Podcast {
  id: string;
  title: string;
  description: string;
  imageUrl: string;
  url: string;
  feedUrl: string;
  categories?: string[];
  addedDate: number;
  lastFetched: number;
  episodes?: Episode[];
}

export interface Episode {
  title: string;
  description: string;
  pubDate: string;
  duration: string;
  audio: string;
}

interface TunerDB extends DBSchema {
  followedPodcasts: {
    key: 'followedPodcasts';
    value: Podcast[];
  };
  recentlyVisitedPodcasts: {
    key: 'recentlyVisitedPodcasts';
    value: Podcast[];
  };
  followedRadioStationIDs: {
    key: 'followedRadioStationIDs';
    value: string[];
  };
  recentlyVisitedRadioStationIDs: {
    key: 'recentlyVisitedRadioStationIDs';
    value: string[];
  };
}

const dbPromise =
  typeof window !== 'undefined'
    ? openDB<TunerDB>('some.1tuner', 1, {
        upgrade(db) {
          db.createObjectStore('followedPodcasts');
          db.createObjectStore('recentlyVisitedPodcasts');
          db.createObjectStore('followedRadioStationIDs');
          db.createObjectStore('recentlyVisitedRadioStationIDs');
        },
      })
    : null;

export async function loadStateFromDB() {
  if (typeof window === 'undefined') return;
  const db = await dbPromise;
  const userPodcasts = (await db?.get('followedPodcasts', 'followedPodcasts')) || [];
  const lastPodcasts = (await db?.get('recentlyVisitedPodcasts', 'recentlyVisitedPodcasts')) || [];
  const userRadioStationIDs = (await db?.get('followedRadioStationIDs', 'followedRadioStationIDs')) || [];
  const lastRadioStationIDs = (await db?.get('recentlyVisitedRadioStationIDs', 'recentlyVisitedRadioStationIDs')) || [];
  followedPodcasts.value = userPodcasts;
  recentlyVisitedPodcasts.value = lastPodcasts;
  followedRadioStationIDs.value = userRadioStationIDs;
  recentlyVisitedRadioStationIDs.value = lastRadioStationIDs;
}

export async function saveStateToDB() {
  if (typeof window === 'undefined') return;
  const db = await dbPromise;
  await db?.put('followedPodcasts', followedPodcasts.value, 'followedPodcasts');
  await db?.put('recentlyVisitedPodcasts', recentlyVisitedPodcasts.value, 'recentlyVisitedPodcasts');
  await db?.put('followedRadioStationIDs', followedRadioStationIDs.value, 'followedRadioStationIDs');
  await db?.put(
    'recentlyVisitedRadioStationIDs',
    recentlyVisitedRadioStationIDs.value,
    'recentlyVisitedRadioStationIDs',
  );
}

export function useDB() {
  return {
    loadStateFromDB,
    saveStateToDB,
  };
}
