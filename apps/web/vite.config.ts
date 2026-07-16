import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';

export default defineConfig({
  plugins: [sveltekit()],
  ssr: {
    noExternal: ['@lol/visual-grammar', '@lol/lens-scenes', '@lol/lens-contracts'],
  },
  optimizeDeps: {
    include: ['@lol/lens-scenes', '@lol/lens-contracts'],
  },
});
