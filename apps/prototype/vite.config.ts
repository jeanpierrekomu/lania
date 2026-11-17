import path from 'node:path'
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// Prototipo navegable de LANIA (importado de Figma Make, sin sus plugins de editor).
export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: { alias: { '@': path.resolve(__dirname, './src') } },
  server: { host: '127.0.0.1', port: 3001, strictPort: true },
})
