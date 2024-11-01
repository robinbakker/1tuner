import { createContext, useContext } from 'preact/compat';
import { useDB } from '../lib/db';

const DatabaseContext = createContext<ReturnType<typeof useDB> | null>(null);

export function DatabaseProvider({ children }: { children: React.ReactNode }) {
  const db = useDB();

  if (typeof window === 'undefined') {
    return <>{children}</>;
  }

  return <DatabaseContext.Provider value={db}>{children}</DatabaseContext.Provider>;
}

export function useDatabase() {
  const context = useContext(DatabaseContext);
  if (!context) {
    throw new Error('useDatabase must be used within a DatabaseProvider');
  }
  return context;
}
