import { ErrorBoundary, LocationProvider, Route, Router } from 'preact-iso';
import { useEffect } from 'preact/hooks';
import './app.css';
import { AppShell } from './components/app-shell';
import { PodcastPage } from './components/podcast-page';
import { PodcastSearch } from './components/podcast-search';
import { RadioStationPage } from './components/radio-station-page';
import { RadioStationSearch } from './components/radio-station-search';
import { DatabaseProvider } from './contexts/DatabaseContext';
import { useDB } from './lib/db';

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

  return (
    <AppShell>
      <LocationProvider>
        <ErrorBoundary>
          <DatabaseProvider>
            <Router>
              <Route path="/" component={RadioStationPage} />
              <Route path="/radio-stations" component={RadioStationSearch} />
              <Route path="/podcasts" component={PodcastSearch} />
              <Route path="/podcast/:name/:id" component={PodcastPage} />
            </Router>
          </DatabaseProvider>
        </ErrorBoundary>
      </LocationProvider>
    </AppShell>
  );
}
