import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';

export default defineConfig({
  plugins: [sveltekit()],
  ssr: {
    noExternal: ['@lol/visual-grammar', '@lol/lens-scenes', '@lol/lens-contracts'],
  },
  optimizeDeps: {
    // These linked ESM packages change in-place during workspace development.
    // Prebundling them can preserve an obsolete export surface across restarts.
    exclude: ['@lol/lens-contracts', '@lol/lens-patterns', '@lol/lens-scenes'],
  },
});
