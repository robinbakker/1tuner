import { settingsState } from '../../src/store/signals/settings';
import { SettingsState } from '../../src/store/types';

export { isDBLoaded } from '../../src/store/db/db';
export { playerState } from '../../src/store/signals/player';

// Keep the actual objects to detect both missed notifications and in-place mutations.
export const settingsUpdates: SettingsState[] = [];
settingsState.subscribe((settings) => settingsUpdates.push(settings));
