import { signal } from '@preact/signals';
import { LogState } from '../types';
import { settingsState } from './settings';

export const logState = signal<LogState[]>([] as LogState[]);

export const addLogEntry = (entry: Omit<LogState, 'timestamp'>) => {
  if (!settingsState.value?.enableLogging) return;
  const newEntry: LogState = {
    ...entry,
    timestamp: new Date(),
  };
  logState.value = [...logState.value, newEntry].slice(-200); // Keep only the last 200 entries
};
