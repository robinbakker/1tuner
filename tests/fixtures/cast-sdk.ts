// Installed before app startup, including the early SDK-availability callback.
export function installCastMock() {
  type Listener = (alive: boolean) => void;
  class Media {
    listeners = new Set<Listener>();
    removed: Listener[] = [];
    playerState = 'PLAYING';
    position = 0;
    seeks: number[] = [];
    plays = 0;
    pauses = 0;
    constructor(public media: { contentId: string; contentType: string; duration?: number }) {}
    addUpdateListener(fn: Listener) {
      this.listeners.add(fn);
    }
    removeUpdateListener(fn: Listener) {
      if (!this.listeners.delete(fn)) throw new Error('Wrong media listener removed');
      this.removed.push(fn);
    }
    emit(alive = true) {
      for (const fn of this.listeners) fn(alive);
    }
    getEstimatedTime() {
      return this.position;
    }
    play(_request: unknown, done: () => void) {
      this.plays++;
      this.playerState = 'PLAYING';
      done();
      this.emit();
    }
    pause(_request: unknown, done: () => void) {
      this.pauses++;
      this.playerState = 'PAUSED';
      done();
      this.emit();
    }
    seek(request: { currentTime: number }, done: () => void) {
      this.seeks.push(request.currentTime);
      this.position = request.currentTime;
      done();
      this.emit();
    }
  }
  type Load = { media: Media['media']; autoplay: boolean; currentTime?: number };
  class Session {
    sessionId = 'mock-session';
    status = 'connected';
    media: Media[] = [];
    listeners = new Set<Listener>();
    mediaListeners = new Set<(media: Media) => void>();
    loads: Load[] = [];
    loadedMedia: Media[] = [];
    pending: (() => void)[] = [];
    defer = false;
    stops = 0;
    failStop = false;
    addUpdateListener(fn: Listener) {
      this.listeners.add(fn);
    }
    removeUpdateListener(fn: Listener) {
      if (!this.listeners.delete(fn)) throw new Error('Wrong session listener removed');
    }
    addMediaListener(fn: (media: Media) => void) {
      this.mediaListeners.add(fn);
    }
    removeMediaListener(fn: (media: Media) => void) {
      if (!this.mediaListeners.delete(fn)) throw new Error('Wrong session media listener removed');
    }
    emit(alive = true) {
      for (const fn of this.listeners) fn(alive);
    }
    loadMedia(request: Load, done: (media: Media) => void) {
      this.loads.push(request);
      const media = new Media({ ...request.media, duration: 600 });
      media.position = request.currentTime ?? 0;
      media.playerState = request.autoplay ? 'PLAYING' : 'PAUSED';
      this.loadedMedia.push(media);
      const complete = () => {
        this.media = [media];
        done(media);
      };
      if (this.defer) this.pending.push(complete);
      else complete();
    }
    stop(done: () => void, fail: (error: string) => void) {
      this.stops++;
      if (this.failStop) {
        fail('mock failure');
        return;
      }
      this.status = 'stopped';
      done();
      this.emit(false);
    }
  }
  const mock = {
    mediaActions: new Map<MediaSessionAction, MediaSessionActionHandler | null>(),
    session: new Session(),
    initializeCalls: 0,
    requestCalls: 0,
    deferInitialize: false,
    deferRequest: false,
    initializeDone: () => {},
    requestDone: () => {},
    onSession: (session: Session) => {
      void session;
    },
    ready() {
      window.chrome.cast.isAvailable = true;
      window.__onGCastApiAvailable?.(true);
    },
  };
  const cast = {
    isAvailable: false,
    SessionRequest: class {},
    ApiConfig: class {
      constructor(_request: unknown, onSession: typeof mock.onSession) {
        mock.onSession = onSession;
      }
    },
    AutoJoinPolicy: { ORIGIN_SCOPED: 'origin' },
    SessionStatus: { STOPPED: 'stopped', DISCONNECTED: 'disconnected' },
    initialize(_config: unknown, done: () => void) {
      mock.initializeCalls++;
      mock.initializeDone = done;
      if (!mock.deferInitialize) done();
    },
    requestSession(done: (session: Session) => void) {
      mock.requestCalls++;
      mock.requestDone = () => {
        mock.onSession(mock.session);
        done(mock.session);
      };
      if (!mock.deferRequest) mock.requestDone();
    },
    media: {
      MediaInfo: class {
        constructor(
          public contentId: string,
          public contentType: string,
        ) {}
      },
      GenericMediaMetadata: class {},
      LoadRequest: class {
        constructor(public media: unknown) {}
      },
      PlayRequest: class {},
      PauseRequest: class {},
      SeekRequest: class {},
      PlayerState: { PLAYING: 'PLAYING', PAUSED: 'PAUSED', BUFFERING: 'BUFFERING' },
      StreamType: { LIVE: 'LIVE', BUFFERED: 'BUFFERED' },
    },
  };
  Object.assign(window.chrome ?? (window.chrome = {} as typeof chrome), { cast });
  Object.assign(window, { castMock: mock });
  navigator.mediaSession.setActionHandler = (action, handler) => {
    mock.mediaActions.set(action, handler);
  };
  const positions = new WeakMap<HTMLMediaElement, number>();
  Object.defineProperties(HTMLMediaElement.prototype, {
    currentTime: {
      configurable: true,
      get() {
        return positions.get(this) ?? 0;
      },
      set(value: number) {
        positions.set(this, value);
      },
    },
    currentSrc: {
      configurable: true,
      get() {
        return this.querySelector('source')?.src ?? '';
      },
    },
    duration: {
      configurable: true,
      get() {
        return 600;
      },
    },
    readyState: {
      configurable: true,
      get() {
        return 4;
      },
    },
    play: {
      configurable: true,
      value() {
        return Promise.resolve();
      },
    },
    pause: { configurable: true, value() {} },
    load: { configurable: true, value() {} },
  });
  return mock;
}

declare global {
  interface Window {
    castMock: ReturnType<typeof installCastMock>;
  }
}
