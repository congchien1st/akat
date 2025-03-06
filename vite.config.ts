import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  optimizeDeps: {
    exclude: ['lucide-react'],
  },
  server: {
    historyApiFallback: true,
    https: {
      key: './localhost+1-key.pem',
      cert: './localhost+1.pem',
    },
    host: 'localhost',
    port: 3000,
  },
});