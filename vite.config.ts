import { defineConfig } from 'vite';
import basicSsl from '@vitejs/plugin-basic-ssl';

export default defineConfig({
  base: './', // Relative paths for GitHub Pages
  plugins: [
    basicSsl(), // Enables HTTPS with auto-generated certificate
  ],
  server: {
    host: true, // Allow access from other devices on network
  },
  optimizeDeps: {
    // Exclude esm-potrace-wasm from pre-bundling so WASM loads correctly
    exclude: ['esm-potrace-wasm'],
  },
});
