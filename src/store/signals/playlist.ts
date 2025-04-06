import { signal } from '@preact/signals';
import { Playlist, PlaylistRule } from '../types';

export const playlists = signal<Playlist[] | null>(null);
export const playlistRules = signal<PlaylistRule[]>([]);
