// Vite build configuration for the client app.
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from 'path'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      // Allow "@/..." imports to point at src.
      "@": path.resolve(__dirname, "./src")
    }
  }
})
