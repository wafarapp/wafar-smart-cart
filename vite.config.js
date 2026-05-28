import base44 from '@base44/vite-plugin';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

export default defineConfig({
  logLevel: 'error',
  plugins: [
    base44({
      legacySDKImports: process.env.BASE44_LEGACY_SDK_IMPORTS === 'true',
      hmrNotifier: true,
      navigationNotifier: true,
      analyticsTracker: true,
      visualEditAgent: true,
    }),
    react(),
  ],
  build: {
    target: 'es2020',
    cssCodeSplit: true,
    sourcemap: false,
    chunkSizeWarningLimit: 600,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules')) {
            if (id.includes('react-dom') || id.includes('/react/')) return 'react-vendor';
            if (id.includes('react-router')) return 'router';
            if (id.includes('@tanstack/react-query')) return 'query';
            if (id.includes('recharts') || id.includes('d3-')) return 'charts';
            if (id.includes('leaflet') || id.includes('react-leaflet')) return 'maps';
            if (id.includes('lucide-react')) return 'icons';
            if (id.includes('@radix-ui')) return 'radix';
            if (id.includes('@base44')) return 'base44';
          }
        },
      },
    },
  },
  optimizeDeps: {
    include: ['react', 'react-dom', 'react-router-dom', '@tanstack/react-query'],
  },
});
