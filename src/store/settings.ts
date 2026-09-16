import { saveStateToDB } from './db/db';
import { settingsState } from './signals/settings';
import { SettingsState } from './types';

export function updateSettings(changes: Partial<SettingsState>) {
  settingsState.value = { ...settingsState.peek(), ...changes };
  void saveStateToDB().catch((error) => {
    console.error('Error saving settings to DB:', error);
  });
}
