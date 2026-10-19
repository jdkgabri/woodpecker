import { defineConfig } from 'vite';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  base: './',
  plugins: [
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['icon-192.png', 'icon-512.png'],
      workbox: {
        globPatterns: ['**/*.{js,css,html,png,svg,json}'],
        globIgnores: ['stockfish/**'],
        // Stockfish (~7 MB) se descarga la primera vez que se analiza y queda guardado
        runtimeCaching: [{
          urlPattern: ({ url }) => url.pathname.includes('/stockfish/'),
          handler: 'CacheFirst',
          options: { cacheName: 'stockfish', expiration: { maxEntries: 4 } },
        }],
        maximumFileSizeToCacheInBytes: 5 * 1024 * 1024,
        navigateFallback: 'index.html',
      },
      manifest: {
        name: 'Woodpecker — entrenamiento táctico',
        short_name: 'Woodpecker',
        description: 'Ciclos del método Woodpecker con pausa y progreso guardado en el dispositivo.',
        lang: 'es',
        display: 'standalone',
        orientation: 'portrait',
        start_url: './',
        scope: './',
        background_color: '#161512',
        theme_color: '#161512',
        icons: [
          { src: 'icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'icon-512.png', sizes: '512x512', type: 'image/png' },
          { src: 'icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
    }),
  ],
});
