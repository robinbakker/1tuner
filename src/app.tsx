import { ErrorBoundary, LocationProvider, Route, Router } from 'preact-iso';
import { useEffect } from 'preact/hooks';
import './app.css';
import { AppShell } from './components/appShell/appShell';
import { AboutPage } from './pages/about';
import { Homepage } from './pages/homepage';
import { NotFound } from './pages/not-found';
import { PodcastPage } from './pages/podcast';
import { PodcastsPage } from './pages/podcasts';
import { RadioStationPage } from './pages/radio-station';
import { RadioStationsPage } from './pages/radio-stations';
import { SettingsPage } from './pages/settings';
import { DatabaseProvider } from './store/db/DatabaseContext';
import { useDB } from './store/db/db';
import { isPlayerMaximized } from './store/signals/player';

export function App() {
  const db = useDB();

  useEffect(() => {
    console.log('Loading state from DB...');
    db.loadStateFromDB();

    const handleBeforeUnload = () => {
      console.log('Saving state to DB...');
      db.saveStateToDB();
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        console.log('App hidden, saving state...');
        db.saveStateToDB();
      }
    };

    // Save state periodically
    const saveInterval = setInterval(() => {
      console.log('Periodic state save...');
      db.saveStateToDB();
    }, 30000); // Every 30 seconds

    if (window) {
      window.addEventListener('beforeunload', handleBeforeUnload);
      document.addEventListener('visibilitychange', handleVisibilityChange);
      window.addEventListener('pagehide', handleBeforeUnload); // Add pagehide event for iOS
    }
    return () => {
      if (window) {
        window.removeEventListener('beforeunload', handleBeforeUnload);
        document.removeEventListener('visibilitychange', handleVisibilityChange);
        window.removeEventListener('pagehide', handleBeforeUnload);
        clearInterval(saveInterval);
      }
      db.saveStateToDB();
    };
  }, []);

  useEffect(() => {
    if (!window) return;

    if (isPlayerMaximized.value) {
      // Prevent scrolling on mobile only
      if (window?.innerWidth < 768) {
        document.body.style.overflow = 'hidden';
      }
    } else {
      document.body.style.overflow = '';
    }

    return () => {
      document.body.style.overflow = '';
    };
  }, [isPlayerMaximized.value]);

  return (
    <LocationProvider>
      <ErrorBoundary>
        <DatabaseProvider>
          <AppShell>
            <Router>
              <Route path="/" component={Homepage} />
              <Route path="/radio-stations" component={RadioStationsPage} />
              <Route path="/radio-station/:id?" component={RadioStationPage} />
              <Route path="/podcasts" component={PodcastsPage} />
              <Route path="/podcast/:name?/:id?" component={PodcastPage} />
              <Route path="/settings" component={SettingsPage} />
              <Route path="/about" component={AboutPage} />
              <NotFound default />
            </Router>
          </AppShell>
        </DatabaseProvider>
      </ErrorBoundary>
    </LocationProvider>
  );
}
