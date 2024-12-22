import { signal } from '@preact/signals';
import { SettingsState } from '../types';

export const settings = signal<SettingsState | null>(null);
