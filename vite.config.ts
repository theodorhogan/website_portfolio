import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  // Base URL for GitHub Pages project site; change to "/" if deploying to <username>.github.io
  base: '/website_portfolio/',
})
