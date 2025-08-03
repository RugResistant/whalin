// vite.config.ts
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import rollupNodePolyFill from 'rollup-plugin-polyfill-node';

export default defineConfig({
  plugins: [
    react(),
    rollupNodePolyFill()
  ],
  optimizeDeps: {
    include: ['buffer', 'process', 'events', 'util', 'stream'],
  },
  define: {
    global: 'globalThis',
  },
  build: {
    rollupOptions: {
      plugins: [rollupNodePolyFill()],
    },
  },
});
