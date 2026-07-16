import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  // Served at https://adityaa-sharma.github.io/neural-chalchitra/
  base: '/neural-chalchitra/',
  plugins: [react()],
})
