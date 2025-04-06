import { RadioStation } from '~/store/types';

export interface PlaylistData {
  url: string;
  name: string;
  stations: RadioStation[];
  stationPercentages: StationPercentage[];
}

export interface StationPercentage {
  stationID: string;
  logo: string;
  name: string;
  startTime: string;
  endTime: string;
  percentage: number;
  startPercentage: number;
  isActive: boolean;
}

export enum RuleDestination {
  Nothing = 0,
  RadioStation = 1,
  Playlist = 2,
}
