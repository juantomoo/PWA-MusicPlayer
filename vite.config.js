import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import { VitePWA } from 'vite-plugin-pwa';
import { resolve } from 'path';

export default defineConfig({
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
    },
  },
  plugins: [
    vue(),
    VitePWA({
      registerType: 'autoUpdate',
      manifest: {
        name: 'PWA Music Player',
        short_name: 'PWA Music',
        description: 'Aplicación web offline para reproducción de música de los directorios del usuario con sus respectivos formatos mp3, flac, ogg, wav y extensiones de listas de reproducción tanto de archivos locales como de archivos remotos. La aplicación puede funcionar completamente fuera de línea por lo que no recolecta información privada y así puedes tener lo mejor de escuchar música con calidad de forma libre, segura y fluida aunque el navegador no esté en primer plano y pudiendo usar los controles multimedia como en otras aplicaciones populares de reproducción multimedia.',
        start_url: '.',
        display: 'standalone',
        background_color: '#48CBA9',
        theme_color: '#552A93',
        icons: [
          {
            src: 'icons/icon-192x192.png',
            sizes: '192x192',
            type: 'image/png',
          },
          {
            src: 'icons/icon-512x512.png',
            sizes: '512x512',
            type: 'image/png',
          },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,png,svg,ico,woff2,woff,ttf,mp3,flac,ogg,wav}'],
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/.*\.(?:mp3|flac|ogg|wav)$/,
            handler: 'CacheFirst',
            options: {
              cacheName: 'audio-cache',
              expiration: {
                maxEntries: 100,
                maxAgeSeconds: 60 * 60 * 24 * 30, // 30 días
              },
            },
          },
        ],
      },
      devOptions: {
        enabled: true,
      },
    }),
  ],
});
