import adapter from '@sveltejs/adapter-static';

const config = {
	kit: {
		adapter: adapter(),
		router: { type: 'hash' }, // hash-based routing (disables SSR/prerender)
		output: { bundleStrategy: 'inline' } // single-file: JS+CSS inlined into HTML
		}
	};
export default config;
