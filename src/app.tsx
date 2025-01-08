import { ErrorBoundary, LocationProvider, Route, Router } from 'preact-iso';
import { useEffect } from 'preact/hooks';
import './app.css';
import { AppShell } from './components/appShell/appShell';
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
    db.loadStateFromDB();

    const handleBeforeUnload = () => {
      db.saveStateToDB();
    };

    if (window) {
      window.addEventListener('beforeunload', handleBeforeUnload);
    }
    return () => {
      if (window) {
        window.removeEventListener('beforeunload', handleBeforeUnload);
      }
      db.saveStateToDB();
    };
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;

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
              <Route path="/radio-station/:id" component={RadioStationPage} />
              <Route path="/podcasts" component={PodcastsPage} />
              <Route path="/podcast/:name/:id" component={PodcastPage} />
              <Route path="/settings" component={SettingsPage} />
              <NotFound default />
            </Router>
          </AppShell>
        </DatabaseProvider>
      </ErrorBoundary>
    </LocationProvider>
  );
}
