/* eslint-disable */
import * as dotenv from 'dotenv';
import * as fs from 'fs/promises';
import * as path from 'path';

dotenv.config();

async function fetchPodcasts() {
  try {
    const FIREBASE_LOGIN_URL = process.env.FIREBASE_LOGIN_URL;
    const FIREBASE_USER_EMAIL = process.env.FIREBASE_USER_EMAIL;
    const FIREBASE_USER_PASSWORD = process.env.FIREBASE_USER_PASSWORD;
    const FIREBASE_URL = process.env.FIREBASE_URL;

    const firebaseAuth = await fetch(FIREBASE_LOGIN_URL, {
      body: JSON.stringify({
        email: FIREBASE_USER_EMAIL,
        password: FIREBASE_USER_PASSWORD,
        returnSecureToken: true,
      }),
      method: 'POST',
    });

    const firebaseAuthResult = await firebaseAuth.json();
    const firebaseAuthToken = firebaseAuthResult.idToken;
    const podcastDataUrl = `${FIREBASE_URL}/podcasts.json?auth=${firebaseAuthToken}`;

    const response = await fetch(podcastDataUrl);
    const data = await response.json();

    const keyArray = Object.keys(data).reverse();
    const podcasts = keyArray
      .slice(0, 500)
      .map((key) => data[key])
      .filter((pc) => pc && pc.feedUrl && pc.title)
      .map((pc) => ({
        title: pc.title,
        description: pc.description,
        imageUrl: pc.logo600 || pc.logo,
        url: pc.feedUrl,
        categories: pc.genres ? pc.genres.map((g) => g.name).filter((g) => !!g) : [],
        addedDate: Date.now(),
        lastFetched: Date.now(),
        episodes: [],
      }));

    await fs.mkdir(path.join(process.cwd(), 'src/assets/data'), { recursive: true });
    await fs.writeFile(path.join(process.cwd(), 'src/assets/data/podcasts.json'), JSON.stringify(podcasts, null, 2));

    console.log('Podcasts data fetched and saved successfully!');
  } catch (error) {
    console.error('Error fetching podcasts:', error);
    process.exit(1);
  }
}

fetchPodcasts();
