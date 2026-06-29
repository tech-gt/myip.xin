import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
  build: {
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
        lookup: resolve(__dirname, 'lookup.html'),
        dns: resolve(__dirname, 'dns.html'),
        whois: resolve(__dirname, 'whois.html'),
        about: resolve(__dirname, 'about.html'),
      },
    },
  },
  server: {
    // When running vite dev server, proxy API calls to wrangler dev server (typically on port 8788)
    proxy: {
      '/api': {
        target: 'http://localhost:8788',
        changeOrigin: true,
      },
    },
  },
});
