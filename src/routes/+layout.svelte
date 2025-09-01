<script>
	import favicon from '$lib/assets/favicon.svg';
	// Global styles (compiled by Vite via sass)
	import '../styles/bootstrap.scss';

	let { children } = $props();
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
</svelte:head>

{@render children?.()}
