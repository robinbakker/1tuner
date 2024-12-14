import { ErrorBoundary, LocationProvider, Route, Router } from 'preact-iso';
import { useEffect } from 'preact/hooks';
import './app.css';
import { AppShell } from './components/app-shell';
import { Homepage } from './pages/homepage';
import { PodcastPage } from './pages/podcast';
import { PodcastsPage } from './pages/podcasts';
import { RadioStationPage } from './pages/radio-station';
import { RadioStationsPage } from './pages/radio-stations';
import { DatabaseProvider } from './store/db/DatabaseContext';
import { useDB } from './store/db/db';
import { playerState } from './store/signals/player';

export function App() {
  const db = useDB();

  useEffect(() => {
    db.loadStateFromDB();

    const handleBeforeUnload = () => {
      db.saveStateToDB();
    };

    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      db.saveStateToDB();
    };
  }, []);

  useEffect(() => {
    if (playerState.value?.isMaximized) {
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
  }, [playerState.value?.isMaximized]);

  return (
    <AppShell>
      <LocationProvider>
        <ErrorBoundary>
          <DatabaseProvider>
            <Router>
              <Route path="/" component={Homepage} />
              <Route path="/radio-stations" component={RadioStationsPage} />
              <Route path="/radio-station/:id" component={RadioStationPage} />
              <Route path="/podcasts" component={PodcastsPage} />
              <Route path="/podcast/:name/:id" component={PodcastPage} />
            </Router>
          </DatabaseProvider>
        </ErrorBoundary>
      </LocationProvider>
    </AppShell>
  );
}
