import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import electron from 'vite-plugin-electron/simple';
import { VitePWA } from 'vite-plugin-pwa';
import path from 'node:path';

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  return {
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
      },
    },
    server: {
      allowedHosts: true, // Allow ngrok and other tunnels
    },
    plugins: [
      react(),
      tailwindcss(),
      VitePWA({
        registerType: 'autoUpdate',
        includeAssets: ['favicon.svg', 'apple-touch-icon.png', 'pwa-192x192.png', 'pwa-512x512.png', 'icon.svg'],
        manifest: {
          name: 'Check Writer',
          short_name: 'Check Writer',
          description: 'Cheque printing and calibration tool',
          theme_color: '#004D40',
          background_color: '#0a0a0b',
          display: 'standalone',
          orientation: 'any',
          start_url: '/',
          scope: '/',
          icons: [
            {
              src: '/pwa-192x192.png',
              sizes: '192x192',
              type: 'image/png',
            },
            {
              src: '/pwa-512x512.png',
              sizes: '512x512',
              type: 'image/png',
            },
            {
              src: '/maskable-icon-512x512.png',
              sizes: '512x512',
              type: 'image/png',
              purpose: 'maskable',
            },
          ],
        },
        workbox: {
          globPatterns: ['**/*.{js,css,html,ico,png,svg,woff,woff2}'],
          runtimeCaching: [
            {
              urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
              handler: 'CacheFirst',
              options: {
                cacheName: 'google-fonts-cache',
                expiration: {
                  maxEntries: 10,
                  maxAgeSeconds: 60 * 60 * 24 * 365,
                },
                cacheableResponse: {
                  statuses: [0, 200],
                },
              },
            },
            {
              urlPattern: /^https:\/\/fonts\.gstatic\.com\/.*/i,
              handler: 'CacheFirst',
              options: {
                cacheName: 'gstatic-fonts-cache',
                expiration: {
                  maxEntries: 10,
                  maxAgeSeconds: 60 * 60 * 24 * 365,
                },
                cacheableResponse: {
                  statuses: [0, 200],
                },
              },
            },
          ],
        },
      }),
      // Build and launch the Electron main process when running in electron mode
      ...(mode === 'electron'
        ? [
            electron({
              main: {
                entry: 'electron/main.ts',
                vite: {
                  output: {
                    // electron-store v10 is ESM-only; keep main as ESM too
                    format: 'esm',
                    entryFileNames: '[name].js',
                  },
                },
              },
              preload: {
                input: path.resolve(__dirname, 'electron/preload.ts'),
                vite: {
                  build: {
                    rollupOptions: {
                      output: {
                        format: 'cjs',
                        entryFileNames: '[name].cjs',
                        chunkFileNames: '[name].cjs',
                      },
                    },
                  },
                },
              },
            }),
          ]
        : []),
    ],
    clearScreen: false,
  };
});
