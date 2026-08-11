import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    host: true,   // Expose on all interfaces — mobile on same WiFi can open it
    port: 5173,
  },
})
