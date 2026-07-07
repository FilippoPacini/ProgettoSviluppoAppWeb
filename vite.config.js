import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

// PWA con vite-plugin-pwa: genera service worker e manifest, con Workbox per il
// caching. registerType 'autoUpdate' aggiorna il SW senza chiedere all'utente.
export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg'],
      manifest: {
        name: 'HabitForge',
        short_name: 'HabitForge',
        description: 'Crescita personale, abitudini e coach AI',
        lang: 'it',
        theme_color: '#0f9b8e',
        background_color: '#fafcfb',
        display: 'standalone',
        start_url: '/',
        icons: [
          { src: '/icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
          { src: '/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
          // Variante maskable: l'OS puo' ritagliarla con la sua maschera senza
          // tagliare il logo, che sta nella safe-zone centrale.
          { src: '/icon-maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      workbox: {
        // Le mutazioni offline sono gia' gestite dall'SDK Firebase; qui aggiungo
        // solo un caching NetworkFirst per le letture Firestore.
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/firestore\.googleapis\.com\/.*/,
            handler: 'NetworkFirst',
            options: { cacheName: 'firestore-cache' },
          },
        ],
      },
    }),
  ],
});
