import { resolve } from 'node:path';

import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';
import electron from 'vite-plugin-electron/simple';
import { notBundle } from 'vite-plugin-electron/plugin';

export default defineConfig({
  base: './',
  build: {
    outDir: 'dist-renderer',
  },
  plugins: [
    react(),
    electron({
      main: {
        entry: 'electron/main.ts',
        vite: {
          plugins: [notBundle()],
          build: {
            rollupOptions: {
              output: {
                entryFileNames: 'main.js',
                format: 'cjs',
              },
            },
          },
        },
      },
      preload: {
        input: resolve(__dirname, 'electron/preload.ts'),
        vite: {
          build: {
            rollupOptions: {
              external: ['electron'],
              output: {
                entryFileNames: 'preload.js',
                format: 'cjs',
              },
            },
          },
        },
      },
    }),
  ],
  server: {
    strictPort: true,
  },
});
