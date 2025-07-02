import { signal } from '@preact/signals';
import { SettingsState } from '../types';

export const DEFAULT_MAX_RECONNECT_ATTEMPTS = 200;

export const settingsState = signal<SettingsState>({} as SettingsState);
