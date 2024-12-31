interface Window {
  chrome: {
    cast: {
      initialized: boolean;
      ApiConfig: typeof chrome.cast.ApiConfig;
      initialize: (
        apiConfig: chrome.cast.ApiConfig,
        successCallback: () => void,
        errorCallback: (error: Error) => void,
      ) => void;
      SessionRequest: typeof chrome.cast.SessionRequest;
      isAvailable: boolean;
      requestSession: (
        successCallback: (session: chrome.cast.Session) => void,
        errorCallback: (error: Error) => void,
      ) => void;
      media: {
        LoadRequest: typeof chrome.cast.media.LoadRequest;
        MediaInfo: typeof chrome.cast.media.MediaInfo;
        GenericMediaMetadata: typeof chrome.cast.media.GenericMediaMetadata;
      };
    };
  };
  __onGCastApiAvailable?: (isAvailable: boolean) => void;
}

// declare namespace chrome.cast {
//   interface Session {
//     loadMedia(request: media.LoadRequest, arg1: (media: any) => void, arg2: (error: any) => void): unknown;
//     media: any;
//     stop: () => void;
//   }

//   class ApiConfig {
//     constructor(
//       sessionRequest: SessionRequest,
//       sessionListener: (session: Session) => void,
//       receiverListener: (availability: string) => void,
//     );
//   }

//   class SessionRequest {
//     constructor(applicationId: string);
//   }

//   namespace media {
//     interface LoadRequest {
//       mediaInfo: MediaInfo;
//     }

//     interface MediaInfo {
//       contentUrl: string;
//       contentType: string;
//       metadata?: GenericMediaMetadata;
//     }

//     interface GenericMediaMetadata {
//       title?: string;
//       subtitle?: string;
//       images?: ImageInfo[];
//     }

//     interface ImageInfo {
//       url: string;
//     }

//     interface Media {
//       getEstimatedTime(): number;
//       seek(request: any): unknown;
//       duration(
//         arg0: string,
//         playerState: any,
//         currentTime: (arg0: string, playerState: any, currentTime: any, duration: any) => unknown,
//         duration: any,
//       ): unknown;
//       currentTime(arg0: string, playerState: any, currentTime: any, duration: any): unknown;
//       addUpdateListener(handleMediaStatusUpdate: (isAlive: boolean) => void): unknown;
//       removeUpdateListener(): unknown;
//       playerState: any;
//       play: (request?: any) => void;
//       pause: (request?: any) => void;
//     }

//     class LoadRequest {
//       autoplay: boolean;
//       constructor(mediaInfo: MediaInfo);
//     }

//     class MediaInfo {
//       constructor(url: string, contentType: string);
//       metadata: GenericMediaMetadata;
//     }

//     class GenericMediaMetadata {
//       constructor();
//       title: string;
//       subtitle: string;
//       images: ImageInfo[];
//     }
//   }
// }
