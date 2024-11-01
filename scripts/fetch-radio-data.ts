// import fs from 'fs/promises';
// import path from 'path';

// async function fetchAndSaveData() {
//   const PUBLIC_DATA_DIR = path.join(process.cwd(), 'public/data');

//   try {
//     // Create the data directory if it doesn't exist
//     await fs.mkdir(PUBLIC_DATA_DIR, { recursive: true });

//     // Fetch the data
//     const [stationsRes, genresRes, languagesRes] = await Promise.all([
//       fetch('https://raw.githubusercontent.com/robinbakker/1tuner/refs/heads/main/assets/data/stations.json'),
//       fetch('https://raw.githubusercontent.com/robinbakker/1tuner/refs/heads/main/assets/data/genres.json'),
//       fetch('https://raw.githubusercontent.com/robinbakker/1tuner/refs/heads/main/assets/data/languages.json'),
//     ]);

//     const [stationsData, genresData, languagesData] = await Promise.all([stationsRes.json(), genresRes.json(), languagesRes.json()]);

//     // Save the data to the public directory
//     await Promise.all([
//       fs.writeFile(path.join(PUBLIC_DATA_DIR, 'stations.json'), JSON.stringify(stationsData)),
//       fs.writeFile(path.join(PUBLIC_DATA_DIR, 'genres.json'), JSON.stringify(genresData)),
//       fs.writeFile(path.join(PUBLIC_DATA_DIR, 'languages.json'), JSON.stringify(languagesData)),
//     ]);

//     console.log('Radio station data updated successfully');
//   } catch (error) {
//     console.error('Error fetching and saving data:', error);
//     process.exit(1);
//   }
// }

// fetchAndSaveData();
