import { fileURLToPath, URL } from 'node:url'

import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

const target = "127.0.0.1:15000";

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    vue(),
  ],
  build: {
    outDir: '../server/assets/dist',
    emptyOutDir: true,
  },
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url))
    },
  },
  server: {
    host: "0.0.0.0",
    port: 80,
    proxy: {
      "/api": {
        target: "http://"+target,
        changeOrigin: true,
      },
      "/ws": {
        target: "ws://"+target,
        changeOrigin: true,
        ws: true,
      },
    }
  },
})
