import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig} from 'vite';
import viteCompression from 'vite-plugin-compression';

export default defineConfig(() => {
  return {
    plugins: [
      react(),
      tailwindcss(),
      viteCompression({
        algorithm: 'gzip',
        ext: '.gz',
      }),
      viteCompression({
        algorithm: 'brotliCompress',
        ext: '.br',
      }),
    ],
    // NOTE: The GEMINI_API_KEY is intentionally NOT exposed to the client.
    // All AI calls go through the backend proxy at /api/* (see server/api.ts).
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    optimizeDeps: {
      include: ['three', 'gsap', '@gsap/react', 'lenis', 'lucide-react']
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modify — file watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
      // Proxy /api requests to the Express backend during development
      proxy: {
        '/api': {
          target: 'http://localhost:3001',
          changeOrigin: true,
        },
      },
    },
  };
});
