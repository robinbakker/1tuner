import { useCallback, useEffect, useRef, useState } from 'preact/hooks';
import { playerState } from '~/store/signals/player';
import { settingsState } from '~/store/signals/settings';

const loadCastSDK = () => {
  return new Promise<void>((resolve, reject) => {
    if (document.querySelector('script[src*="cast_sender.js"]')) {
      resolve();
      return;
    }
    const script = document.createElement('script');
    script.src = 'https://www.gstatic.com/cv/js/sender/v1/cast_sender.js?loadCastFramework=1';
    script.async = true;
    script.onload = () => resolve();
    script.onerror = (e) => reject(e);
    document.head.appendChild(script);
  });
};

export const useCastApi = () => {
  const [castSession, setCastSession] = useState<chrome.cast.Session | null>(null);
  const castMediaRef = useRef<chrome.cast.media.Media | null>(null);
  const castInitialized = useRef(false);
  const APPLICATION_ID = '2CFD5B94';

  const setupMediaListeners = useCallback(
    (media: chrome.cast.media.Media) => {
      castMediaRef.current = media;
      media.addUpdateListener((isAlive: boolean) => {
        if (!isAlive || !media || !playerState.value) return;

        const isPlaying = media.playerState === chrome.cast.media.PlayerState.PLAYING;
        if (playerState.value.isPlaying !== isPlaying) {
          playerState.value = {
            ...playerState.value,
            isPlaying,
          };
        }
      });
    },
    [playerState.value],
  );

  const updateCastMedia = useCallback(
    (session: chrome.cast.Session) => {
      try {
        const media = session.media?.[0];
        if (media) {
          console.log('Found active media session:', media);
          castMediaRef.current = media;
          setupMediaListeners(media);
        } else {
          console.log('No active media session found');
          castMediaRef.current = null;
        }
      } catch (error) {
        console.error('Error updating cast media:', error);
        castMediaRef.current = null;
      }
    },
    [setupMediaListeners],
  );

  const initializeCastApi = useCallback(() => {
    if (typeof window === 'undefined' || !window.chrome?.cast || castInitialized.current) return;

    try {
      // Ensure the cast API is actually available
      if (!window.chrome.cast.isAvailable) {
        console.log('Cast API not yet available, waiting...');
        return;
      }

      const sessionRequest = new window.chrome.cast.SessionRequest(APPLICATION_ID);
      if (!sessionRequest) {
        console.error('Failed to create session request');
        return;
      }

      const apiConfig = new window.chrome.cast.ApiConfig(
        sessionRequest,
        (session) => {
          console.log('Cast session established:', session);
          setCastSession(session);
          updateCastMedia(session);
        },
        (availability) => {
          console.log('Receiver availability:', availability);
        },
        chrome.cast.AutoJoinPolicy.ORIGIN_SCOPED,
      );

      window.chrome.cast.initialize(
        apiConfig,
        () => {
          console.log('Cast API initialized');
          castInitialized.current = true;
        },
        (error) => console.error('Cast API initialization error:', error),
      );
    } catch (error) {
      console.error('Error during Cast API initialization:', error);
    }
  }, [updateCastMedia]);

  const createMediaInfo = useCallback(() => {
    if (!playerState.value) return null;
    const playerStateStream = playerState.value?.streams?.[0];
    if (!playerStateStream) return null;

    const mediaInfo = new chrome.cast.media.MediaInfo(playerStateStream.url, playerStateStream.mimetype);

    mediaInfo.metadata = new chrome.cast.media.GenericMediaMetadata();
    mediaInfo.metadata.title = playerState.value.title;
    mediaInfo.metadata.subtitle = playerState.value.description;
    mediaInfo.metadata.images = [{ url: playerState.value.imageUrl }];

    return mediaInfo;
  }, [playerState.value]);

  const loadMedia = useCallback(
    async (session: chrome.cast.Session) => {
      return new Promise((resolve, reject) => {
        const mediaInfo = createMediaInfo();
        if (!mediaInfo) {
          resolve(null);
          return;
        }

        console.log('Loading media:', mediaInfo);

        const request = new chrome.cast.media.LoadRequest(mediaInfo);
        // Set initial playback state
        request.autoplay = false; // Prevent auto-playing

        session.loadMedia(
          request,
          (media) => {
            console.log('Media loaded:', media);

            if (media) {
              setupMediaListeners(media);
              if (playerState.value?.isPlaying) {
                media.play(
                  new chrome.cast.media.PlayRequest(),
                  () => console.log('Playback started'),
                  (error) => {
                    if (playerState.value) playerState.value.isPlaying = false;
                    console.error('Error starting playback:', error);
                  },
                );
              } else {
                media.pause(
                  new chrome.cast.media.PauseRequest(),
                  () => console.log('Playback paused while loading media'),
                  (error) => console.error('Error pausing playback while loading media:', error),
                );
              }
            }
            resolve(media);
          },
          (error) => {
            console.error('Error loading media:', error);
            reject(error);
          },
        );
      });
    },
    [createMediaInfo, setupMediaListeners, playerState.value],
  );

  const startCasting = useCallback(async () => {
    console.log('Starting cast...');

    if (!playerState.value?.streams?.[0]?.url) return;

    try {
      if (!castSession) {
        await new Promise<void>((resolve, reject) => {
          window.chrome.cast.requestSession(
            async (session) => {
              setCastSession(session);
              await loadMedia(session);
              resolve();
            },
            (error) => reject(error),
          );
        });
      }
    } catch (error) {
      console.error('Error starting cast:', error);
    }
  }, [castSession, loadMedia, playerState.value]);

  const stopCasting = useCallback(() => {
    if (castSession) {
      if (castMediaRef.current) {
        castMediaRef.current.removeUpdateListener(() => {});
      }
      castSession.stop(
        () => console.log('Casting stopped'),
        (error) => console.error('Error stopping playback:', error),
      );
      setCastSession(null);
      castMediaRef.current = null;
    }
  }, [castSession]);

  const handleCastPlayPause = useCallback((isPlaying: boolean) => {
    if (!castMediaRef.current) return;
    if (isPlaying) {
      castMediaRef.current.play(
        new chrome.cast.media.PlayRequest(),
        () => console.log('Playback started (play action)'),
        (error) => console.error('Error starting playback (play):', error),
      );
    } else {
      castMediaRef.current.pause(
        new chrome.cast.media.PauseRequest(),
        () => console.log('Playback paused (pause action)'),
        (error) => console.error('Error pausing playback:', error),
      );
    }
  }, []);

  const handleCastSeek = useCallback((seconds: number) => {
    if (!castMediaRef.current) return;

    const newTime = castMediaRef.current.getEstimatedTime() + seconds;
    const request = new chrome.cast.media.SeekRequest();
    request.currentTime = newTime;
    castMediaRef.current.seek(
      request,
      () => console.log('Seek (seek action)'),
      (error) => console.error('Error seeking:', error),
    );
  }, []);

  const handleCastPlaybackRateChange = useCallback(
    //(rate: number) => {
    () => {
      if (!castMediaRef.current) return;
      // const request = new chrome.cast.media.SetPlaybackRateRequest(rate);
      // castMediaRef.current.setPlaybackRate(request);
    },
    [],
  );

  // Initialize Chromecast only if enabled in settings
  useEffect(() => {
    if (settingsState.value.enableChromecast && typeof window !== 'undefined') {
      let initializationTimer: number;

      loadCastSDK()
        .then(() => {
          window.__onGCastApiAvailable = (isAvailable: boolean) => {
            if (isAvailable) {
              // Add a small delay to ensure the API is fully loaded
              initializationTimer = window.setTimeout(() => {
                initializeCastApi();
              }, 100);
            }
          };
        })
        .catch((error) => {
          console.error('Failed to load Cast SDK:', error);
        });

      return () => {
        // Cleanup when Chromecast is disabled
        clearTimeout(initializationTimer);
        delete window.__onGCastApiAvailable;
        const scriptTag = document.querySelector('script[src*="cast_sender.js"]');
        if (scriptTag) {
          scriptTag.remove();
        }
        setCastSession(null);
        castMediaRef.current = null;
        castInitialized.current = false;
      };
    }
  }, [initializeCastApi, settingsState.value.enableChromecast]);

  return {
    startCasting,
    stopCasting,
    handleCastPlayPause,
    handleCastSeek,
    handleCastPlaybackRateChange,
    isCastingAvailable: settingsState.value.enableChromecast && !!castInitialized.current,
    castSession,
    castMediaRef,
  };
};
