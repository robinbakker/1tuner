import preact from '@preact/preset-vite';
import tailwindcss from '@tailwindcss/vite';
import path from 'path';
import { defineConfig } from 'vite';
import { VitePWA } from 'vite-plugin-pwa';
import { APP_VERSION } from './src/lib/version.ts';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    preact({ prerender: { enabled: true, renderTarget: '#app', previewMiddlewareEnabled: true } }),
    tailwindcss(),
    VitePWA({
      injectRegister: 'script-defer',
      registerType: 'autoUpdate',
      manifest: false,
      workbox: {
        globPatterns: ['index.html', 'assets/**/*.{js,css,html}', 'manifest.json'],
        globIgnores: ['**/build-only-*.js'],
        navigateFallback: 'index.html',
        cacheId: `1tuner-${APP_VERSION}`,
        clientsClaim: true,
        skipWaiting: true,
        cleanupOutdatedCaches: true,
        maximumFileSizeToCacheInBytes: 5 * 1024 * 1024, // 5MB
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/.*\.(png|jpg|jpeg|svg|gif|ico)$/,
            handler: 'CacheFirst',
            options: {
              cacheName: 'image-cache',
              expiration: {
                maxEntries: 200,
                maxAgeSeconds: 7 * 24 * 60 * 60, // 7 days
              },
            },
          },
          {
            urlPattern: ({ request }) => {
              return request.destination === 'audio' || request.destination === 'video';
            },
            handler: 'NetworkOnly',
          },
        ],
      },
    }),
  ],
  build: {
    manifest: true,
    rollupOptions: {
      output: {
        chunkFileNames(chunk) {
          const id = chunk.facadeModuleId?.replaceAll('\\', '/');
          const buildOnly =
            id?.endsWith('/src/prerender.tsx') ||
            id?.endsWith('/src/assets/data/podcasts.json') ||
            id?.endsWith('/preact-iso/src/prerender.js');
          return buildOnly ? 'assets/build-only-[name]-[hash].js' : 'assets/[name]-[hash].js';
        },
      },
    },
  },
  resolve: {
    alias: {
      '~': path.resolve(import.meta.dirname, './src'),
    },
  },
});
