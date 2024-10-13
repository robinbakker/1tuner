export interface Stream {
  mimetype: string;
  url: string;
}

export interface RadioStation {
  id: string;
  name: string;
  logo: string;
  language: string;
  genres: string[];
  streams: Stream[];
}
