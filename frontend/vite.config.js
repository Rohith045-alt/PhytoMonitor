import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  base: '/PhytoMonitor/',
  plugins: [react(), tailwindcss()],
  server: {
    host: true, // Listens on 0.0.0.0 to allow access from local network
    proxy: {
      '/api': 'http://localhost:5000' // Proxy all API requests to the backend
    }
  }
})
