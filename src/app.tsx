import { ErrorBoundary, lazy, LocationProvider, Route, Router } from 'preact-iso';
import { useEffect, useLayoutEffect, useState } from 'preact/hooks';
import './app.css';
import { AppShell } from './components/appShell/appShell';
import { Button } from './components/ui/button';
import { Homepage } from './pages/homepage';
import { NotFound } from './pages/not-found';
import { isDBLoaded, loadStateFromDB, saveStateToDB, startStatePersistence } from './store/db/db';
import { migrateOldData } from './store/db/migration';
import { isPlayerMaximized } from './store/signals/player';

const AboutPage = lazy(() => import('./pages/about').then((module) => module.AboutPage));
const PlaylistPage = lazy(() => import('./pages/playlist').then((module) => module.PlaylistPage));
const PlaylistsPage = lazy(() => import('./pages/playlists').then((module) => module.PlaylistsPage));
const PodcastPage = lazy(() => import('./pages/podcast').then((module) => module.PodcastPage));
const PodcastsPage = lazy(() => import('./pages/podcasts').then((module) => module.PodcastsPage));
const RadioStationPage = lazy(() => import('./pages/radio-station').then((module) => module.RadioStationPage));
const RadioStationsPage = lazy(() => import('./pages/radio-stations').then((module) => module.RadioStationsPage));
const SettingsPage = lazy(() => import('./pages/settings').then((module) => module.SettingsPage));

export function App() {
  const [hasHydrated, setHasHydrated] = useState(false);
  const [loadError, setLoadError] = useState(false);
  const [loadAttempt, setLoadAttempt] = useState(0);

  // Match the prerendered app on the first browser render. Switching to the loading
  // screen during hydration leaves orphaned server markup beside the live router.
  useLayoutEffect(() => {
    setHasHydrated(true);
  }, []);

  useEffect(() => {
    let disposed = false;
    async function initializeApp() {
      try {
        await migrateOldData();
        await loadStateFromDB();
      } catch (error) {
        console.error('Error loading saved data:', error);
        if (!disposed) setLoadError(true);
      }
    }

    void initializeApp();
    return () => {
      disposed = true;
    };
  }, [loadAttempt]);

  useEffect(() => {
    const stopPersistence = startStatePersistence();

    const handleBeforeUnload = () => {
      console.log('Saving state to DB...');
      saveStateToDB();
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        console.log('App hidden, saving state...');
        saveStateToDB();
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('pagehide', handleBeforeUnload); // Add pagehide event for iOS

    return () => {
      stopPersistence();
      window.removeEventListener('beforeunload', handleBeforeUnload);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('pagehide', handleBeforeUnload);
      saveStateToDB();
    };
  }, []);

  useEffect(() => {
    if (isPlayerMaximized.value) {
      // Prevent scrolling on mobile only
      if (window.innerWidth < 768) {
        document.body.style.overflow = 'hidden';
      }
    } else {
      document.body.style.overflow = '';
    }

    return () => {
      document.body.style.overflow = '';
    };
  }, []);

  if (hasHydrated && !isDBLoaded.value) {
    return (
      <main class="container mx-auto px-8 py-12">
        {loadError ? (
          <div role="alert">
            <h1 class="text-2xl font-bold mb-4">Could not load your saved data</h1>
            <p class="mb-4">Your saved data has not been changed. Retry to continue.</p>
            <Button
              onClick={() => {
                setLoadError(false);
                setLoadAttempt((attempt) => attempt + 1);
              }}
            >
              Retry
            </Button>
          </div>
        ) : (
          <p role="status">Loading your saved data…</p>
        )}
      </main>
    );
  }

  return (
    <LocationProvider>
      <ErrorBoundary>
        <AppShell>
          <Router>
            <Route path="/" component={Homepage} />
            <Route path="/radio-stations" component={RadioStationsPage} />
            <Route path="/radio-station/:id?" component={RadioStationPage} />
            <Route path="/podcasts" component={PodcastsPage} />
            <Route path="/podcast/:name?/:id?/:episodeID?" component={PodcastPage} />
            <Route path="/playlists" component={PlaylistsPage} />
            <Route path="/playlist/:name?" component={PlaylistPage} />
            <Route path="/settings" component={SettingsPage} />
            <Route path="/about" component={AboutPage} />
            <Route default component={NotFound} />
          </Router>
        </AppShell>
      </ErrorBoundary>
    </LocationProvider>
  );
}
