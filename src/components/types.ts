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
  name: string;
  logo: string;
  language: string;
  genres: string[];
  streams: Stream[];
  socialAccounts?: SocialAccount[];
}
