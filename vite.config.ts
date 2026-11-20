import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  // Caminhos relativos: o build funciona em qualquer subpasta (GitHub Pages, Vercel, Netlify…).
  base: './',
  plugins: [react()],
  build: {
    target: 'es2022',
    // A cena 3D vai para um chunk próprio, carregado sob demanda depois do conteúdo.
    chunkSizeWarningLimit: 1000,
  },
})
