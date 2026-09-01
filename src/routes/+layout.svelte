<script lang="ts">
	import './layout.css';
	import favicon from '$lib/assets/favicon.svg';
	import { page } from '$app/state';

	let { children } = $props();

	const nav = [
		{ href: '/', label: 'Dashboard' },
		{ href: '/fixkosten', label: 'Fixkosten' },
		{ href: '/einnahmen', label: 'Einnahmen' },
		{ href: '/kategorien', label: 'Kategorien' },
		{ href: '/vermoegen', label: 'Vermögen' },
		{ href: '/verlauf', label: 'Verlauf' },
		{ href: '/einstellungen', label: 'Einstellungen' }
	];

	function istAktiv(href: string) {
		if (href === '/') return page.url.pathname === '/' || page.url.pathname.startsWith('/monat/');
		return page.url.pathname.startsWith(href);
	}
</script>

<svelte:head><link rel="icon" href={favicon} /></svelte:head>

<div class="min-h-screen bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-100">
	<header class="border-b border-slate-200 bg-white/80 backdrop-blur dark:border-slate-800 dark:bg-slate-950/80">
		<div class="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
			<span class="text-lg font-bold">💰 Sparrate</span>
			<nav class="flex gap-1">
				{#each nav as item (item.href)}
					<a
						href={item.href}
						class="rounded-lg px-3 py-1.5 text-sm font-medium transition-colors {istAktiv(item.href)
							? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900'
							: 'text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800'}"
					>
						{item.label}
					</a>
				{/each}
			</nav>
		</div>
	</header>

	<main class="mx-auto max-w-5xl px-4 py-6">
		{@render children()}
	</main>
</div>
