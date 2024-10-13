import { DBSchema, openDB } from 'idb';
import { followedPodcasts, recentlyVisitedPodcasts } from './store';

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
  // Add any other fields you need from the full podcast data
}

export interface Episode {
  title: string;
  description: string;
  pubDate: string;
  duration: string;
  audioUrl: string;
}

interface MyDB extends DBSchema {
  followedPodcasts: {
    key: 'followedPodcasts';
    value: Podcast[];
  };
  recentlyVisitedPodcasts: {
    key: 'recentlyVisitedPodcasts';
    value: Podcast[];
  };
}

const dbPromise = openDB<MyDB>('some.1tuner', 1, {
  upgrade(db) {
    db.createObjectStore('followedPodcasts');
    db.createObjectStore('recentlyVisitedPodcasts');
  },
});

export async function loadStateFromDB() {
  const db = await dbPromise;
  const followed = (await db.get('followedPodcasts', 'followedPodcasts')) || [];
  const recent = (await db.get('recentlyVisitedPodcasts', 'recentlyVisitedPodcasts')) || [];
  followedPodcasts.value = followed;
  recentlyVisitedPodcasts.value = recent;
}

export async function saveStateToDB() {
  const db = await dbPromise;
  await db.put('followedPodcasts', followedPodcasts.value, 'followedPodcasts');
  await db.put('recentlyVisitedPodcasts', recentlyVisitedPodcasts.value, 'recentlyVisitedPodcasts');
}

export function useDB() {
  return {
    loadStateFromDB,
    saveStateToDB,
  };
}
