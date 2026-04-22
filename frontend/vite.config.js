import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/restaurants': 'http://localhost',
      '/reviews': 'http://localhost',
      '/favorites': 'http://localhost',
      '/users': 'http://localhost',
      '/auth': 'http://localhost',
      '/owners': 'http://localhost',
      '/preferences': 'http://localhost',
      '/ai-assistant': 'http://localhost',
      '/uploads': 'http://localhost',
    },
  },
})
