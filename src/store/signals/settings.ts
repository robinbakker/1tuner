import { signal } from '@preact/signals';
import { SettingsState } from '../types';

export const settingsState = signal<SettingsState>({} as SettingsState);
