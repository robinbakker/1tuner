import preact from '@preact/preset-vite';
import path from 'path';
import { defineConfig } from 'vite';
import { VitePWA } from 'vite-plugin-pwa';
import { APP_VERSION } from './src/lib/version';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    preact({ prerender: { enabled: true, renderTarget: '#app' } }),
    VitePWA({
      injectRegister: 'auto',
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg}'],
        cacheId: `1tuner-${APP_VERSION}`,
        clientsClaim: true,
        skipWaiting: true,
      },
    }),
  ],
  resolve: {
    alias: {
      '~': path.resolve(__dirname, './src'),
    },
  },
});
