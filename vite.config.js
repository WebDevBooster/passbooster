import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';

export default defineConfig({
	plugins: [sveltekit()],
	build: { assetsInlineLimit: 1000000 }, // ~1MB threshold for inlining
	base: '' // friendly with file:// URLs
});
