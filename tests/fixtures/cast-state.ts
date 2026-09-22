export { currentTime, durationSignal } from '../../src/components/player/usePlayer';
export { isDBLoaded, saveStateToDB } from '../../src/store/db/db';
export { isPlayerMaximized, playerState } from '../../src/store/signals/player';
export { followedPodcasts, recentlyVisitedPodcasts } from '../../src/store/signals/podcast';
export { settingsState } from '../../src/store/signals/settings';
import { render } from 'preact';

export const unmountApp = () => render(null, document.getElementById('app')!);
