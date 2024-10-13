import { ErrorBoundary, LocationProvider, Route, Router } from 'preact-iso';
import { useEffect } from 'preact/hooks';
import './app.css';
import { AppShellComponent } from './components/app-shell';
import { PodcastPageComponent } from './components/podcast-page';
import { PodcastSearchComponent } from './components/podcast-search';
import { RadioStationPageComponent } from './components/radio-station-page';
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
    <AppShellComponent>
      <LocationProvider>
        <ErrorBoundary>
          <DatabaseProvider>
            <Router>
              <Route path="/" component={RadioStationPageComponent} />
              <Route path="/radio-stations" component={RadioStationPageComponent} />
              <Route path="/podcasts" component={PodcastSearchComponent} />
              <Route path="/podcast/:name/:id" component={PodcastPageComponent} />
            </Router>
          </DatabaseProvider>
        </ErrorBoundary>
      </LocationProvider>
    </AppShellComponent>
  );
}
