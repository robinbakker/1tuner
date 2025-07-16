import { computed, signal } from '@preact/signals';
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

export const hasLog = computed(() => logState.value.length > 0);

export const logStateByDay = computed(() => {
  if (!hasLog.value) return {};
  const grouped: Record<string, LogState[]> = {};
  logState.value.forEach((entry) => {
    const date = entry.timestamp.toISOString().split('T')[0]; // Get date in YYYY-MM-DD format
    if (!grouped[date]) {
      grouped[date] = [];
    }
    grouped[date].push(entry);
  });
  return grouped;
});

export const logDays = computed(() => {
  return Object.keys(logStateByDay.value).sort((a, b) => new Date(b).getTime() - new Date(a).getTime());
});
