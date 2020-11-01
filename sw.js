import { getFiles, setupPrecaching, setupRouting } from 'preact-cli/sw';
import { registerRoute } from 'workbox-routing';
import { NetworkOnly } from 'workbox-strategies';

registerRoute(
  ({url}) => url.pathname.endsWith('.mp3'),
  new NetworkOnly()
);

setupRouting();

const urlsToCache = getFiles();
urlsToCache.push({url: '/favicon.ico', revision: null});

setupPrecaching(urlsToCache);
