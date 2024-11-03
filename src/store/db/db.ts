import { DBSchema, openDB } from 'idb';
import { playerState } from '../signals/player';
import { followedPodcasts, recentlyVisitedPodcasts } from '../signals/podcast';
import { followedRadioStationIDs, recentlyVisitedRadioStationIDs } from '../signals/radio';
import { PlayerState, Podcast } from '../types';

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
  playerState: {
    key: 'playerState';
    value: PlayerState | null;
  };
}

const dbPromise =
  typeof window !== 'undefined'
    ? openDB<TunerDB>('1tuner', 1, {
        upgrade(db) {
          db.createObjectStore('followedPodcasts');
          db.createObjectStore('recentlyVisitedPodcasts');
          db.createObjectStore('followedRadioStationIDs');
          db.createObjectStore('recentlyVisitedRadioStationIDs');
          db.createObjectStore('playerState');
        },
      })
    : null;

export async function loadStateFromDB() {
  if (typeof window === 'undefined') return;
  const db = await dbPromise;
  const dbFollowedPodcasts = (await db?.get('followedPodcasts', 'followedPodcasts')) || [];
  const dbRecentlyVisitedPodcasts = (await db?.get('recentlyVisitedPodcasts', 'recentlyVisitedPodcasts')) || [];
  const dbFollowedRadioStationIDs = (await db?.get('followedRadioStationIDs', 'followedRadioStationIDs')) || [];
  const dbRecentlyVisitedRadioStationIDs =
    (await db?.get('recentlyVisitedRadioStationIDs', 'recentlyVisitedRadioStationIDs')) || [];
  const dbPlayerState = (await db?.get('playerState', 'playerState')) || null;
  followedPodcasts.value = dbFollowedPodcasts;
  recentlyVisitedPodcasts.value = dbRecentlyVisitedPodcasts;
  followedRadioStationIDs.value = dbFollowedRadioStationIDs;
  recentlyVisitedRadioStationIDs.value = dbRecentlyVisitedRadioStationIDs;
  playerState.value = dbPlayerState;
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
  await db?.put('playerState', playerState.value, 'playerState');
}

export function useDB() {
  return {
    loadStateFromDB,
    saveStateToDB,
  };
}
