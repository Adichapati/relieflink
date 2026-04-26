import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
  },
  optimizeDeps: {
    // Force pre-bundling of these Firebase entry points so esbuild does not
    // wander into the broken `index.esm2017.js.map` sourcemap that ships in
    // firebase@10.x and crash with "Unterminated string literal".
    include: [
      'firebase/app',
      'firebase/auth',
      'firebase/firestore',
    ],
    esbuildOptions: {
      target: 'es2020',
    },
  },
});
