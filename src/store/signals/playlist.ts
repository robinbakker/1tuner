import { signal } from '@preact/signals';
import { Playlist } from '../types';

export const playlists = signal<Playlist[] | null>(null);
