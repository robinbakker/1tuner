import * as fs from 'fs/promises';
import * as path from 'path';

async function processPodcastsForStations() {
  try {
    // Read the podcast and stations data
    const podcastsData = JSON.parse(
      await fs.readFile(path.join(process.cwd(), 'src/assets/data/podcasts.json'), 'utf-8'),
    );
    const stationsData = JSON.parse(
      await fs.readFile(path.join(process.cwd(), 'src/assets/data/stations.json'), 'utf-8'),
    );

    // Create a map of podcast URLs to their full data for quick lookup
    const podcastMap = new Map();
    podcastsData.forEach((podcast) => {
      podcastMap.set(podcast.url.toLowerCase(), podcast);
    });

    // Process each station
    const stationPodcasts = {};

    stationsData.stations.forEach((station) => {
      if (station.podcasts && station.podcasts.length > 0) {
        const matchedPodcasts = station.podcasts
          .map((podcastUrl) => podcastMap.get(podcastUrl.toLowerCase()))
          .filter(Boolean); // Remove any undefined entries

        if (matchedPodcasts.length > 0) {
          stationPodcasts[station.id] = matchedPodcasts;
        }
      }
    });

    // Create the data directory if it doesn't exist
    await fs.mkdir(path.join(process.cwd(), 'src/assets/data/stations'), { recursive: true });

    // Save the results
    await fs.writeFile(
      path.join(process.cwd(), 'src/assets/data/stations/podcasts.json'),
      JSON.stringify(stationPodcasts, null, 2),
    );

    console.log('Station podcasts processed and saved successfully!');
  } catch (error) {
    console.error('Error processing station podcasts:', error);
    process.exit(1);
  }
}

processPodcastsForStations();
