import { render } from 'preact';
import { usePodcastData } from '../../src/hooks/usePodcastData';
export { updatePodcastEpisodeCurrentTime } from '../../src/store/signals/podcast';

export let result: ReturnType<ReturnType<typeof usePodcastData>['fetchPodcastData']>;

export function startFetch(id: string, feedUrl: string, skipCache: boolean) {
  const container = document.createElement('div');
  let fetchPodcastData!: ReturnType<typeof usePodcastData>['fetchPodcastData'];
  function Harness() {
    fetchPodcastData = usePodcastData().fetchPodcastData;
    return null;
  }
  render(<Harness />, container);
  result = fetchPodcastData(id, feedUrl, skipCache).finally(() => render(null, container));
}
