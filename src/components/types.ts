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
