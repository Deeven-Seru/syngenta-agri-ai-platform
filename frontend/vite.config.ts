import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

const base = '/syngenta-agri-ai-platform/'

export default defineConfig({
  plugins: [react()],
  base,
})