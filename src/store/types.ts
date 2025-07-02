import { ThemeOption } from '~/pages/settings/types';

export interface Stream {
  mimetype: string;
  url: string;
}

export enum SocialAccountType {
  Facebook = 'facebook',
  Twitter = 'twitter',
  Instagram = 'instagram',
  Youtube = 'youtube',
  TikTok = 'tiktok',
}

export interface SocialAccount {
  type: SocialAccountType;
  title: string;
  url: string;
  account?: string;
}

export interface RadioStation {
  id: string;
  displayorder: number;
  name: string;
  logosource: string;
  language: string;
  genres: string[];
  streams: Stream[];
  website?: string;
  social?: SocialAccount[];
  podcasts?: string[];
  related?: string[];
  stationuuid?: string;
  lastChanged?: string;
}

export interface Language {
  id: string;
  abbr: string;
  country: string;
  country_en: string;
  displayorder: number;
  flag?: string;
  name: string;
  name_en: string;
}

export interface Genre {
  id: string;
  name: string;
}

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
  guid?: string;
  pubDate: Date;
  duration: string;
  audio: string;
  mimeType: string;
  currentTime?: number;
}

export interface PlaylistItem {
  time: string;
  stationID: string;
}

export interface Playlist {
  url: string;
  name: string;
  items: PlaylistItem[];
  timeZone?: string;
  oldUrl?: string;
}

export interface PlayerState {
  playType: 'none' | 'radio' | 'podcast' | 'playlist';
  isPlaying: boolean;
  contentID: string;
  title: string;
  description?: string;
  imageUrl: string;
  streams: Stream[];
  pageLocation: string;
  currentTime?: number;
  shareUrl?: string;
}

export interface PodcastJsonGenre {
  genreId: string;
  name: string;
}

export interface PodcastSearchResult {
  query: string;
  result: Podcast[];
}

export interface RadioSearchResult {
  query: string;
  radioBrowserSearchResult?: RadioStation[];
}

export interface RadioSearchFilters {
  regions: string[];
  genres: string[];
}

export interface UIState {
  headerTitle: string;
  headerDefaultTextColor: 'light' | 'default';
}

export enum PodcastSearchProvider {
  Apple = 'Apple',
  PodcastIndex = 'PodcastIndex',
}

export interface SettingsState {
  theme?: ThemeOption;
  radioStreamMaxReconnects?: number;
  podcastSearchProvider?: PodcastSearchProvider;
  enableChromecast?: boolean;
  disableReconnectNoise?: boolean;
  enableLogging?: boolean;
}

export enum PlaylistRuleType {
  podcastToStation = 'podcastToStation',
  podcastToPlaylist = 'podcastToPlaylist',
}

export interface PlaylistRule {
  ruleType: PlaylistRuleType;
  podcastID?: string;
  stationID?: string;
  playlistUrl?: string;
}

export interface LogState {
  timestamp: Date;
  level: 'info' | 'warn' | 'error';
  message: string;
}
