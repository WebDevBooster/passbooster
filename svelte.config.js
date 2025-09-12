import adapter from '@sveltejs/adapter-static';
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';

const config = {
	preprocess: vitePreprocess(),
	kit: {
		adapter: adapter(),
		router: { type: 'hash' }, // hash-based routing (disables SSR/prerender)
		output: { bundleStrategy: 'inline' }, // single-file: JS+CSS inlined into HTML
		paths: { relative: true },             // GH Pages friendly
		version: { pollInterval: 0 }           // ⬅️ no /_app/version.json fetch
		}
	};
export default config;
