import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// base sätts till repo-namnet så att bygget fungerar på GitHub Pages.
export default defineConfig({
  plugins: [react()],
  base: process.env.GITHUB_PAGES ? '/leides-ljuvliga-lilla-skolkarta/' : '/',
});
