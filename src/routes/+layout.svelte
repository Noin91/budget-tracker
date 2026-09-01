<script lang="ts">
	import './layout.css';
	import favicon from '$lib/assets/favicon.svg';
	import { page } from '$app/state';
	import { afterNavigate } from '$app/navigation';

	let { children } = $props();
	let menuOffen = $state(false);

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

	afterNavigate(() => {
		menuOffen = false;
	});
</script>

<svelte:head><link rel="icon" href={favicon} /></svelte:head>
<svelte:window
	onkeydown={(e) => {
		if (e.key === 'Escape') menuOffen = false;
	}}
/>

<div class="min-h-screen bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-100">
	<header
		class="sticky top-0 z-50 border-b border-slate-200 bg-white/90 backdrop-blur dark:border-slate-800 dark:bg-slate-950/90"
	>
		<div class="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
			<span class="text-lg font-bold">💰 Sparrate</span>

			<!-- Desktop-Navigation -->
			<nav class="hidden md:flex md:gap-1">
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

			<!-- Mobile: Menü-Button -->
			<button
				type="button"
				class="flex h-11 w-11 items-center justify-center rounded-lg text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800 md:hidden"
				aria-label={menuOffen ? 'Menü schließen' : 'Menü öffnen'}
				aria-expanded={menuOffen}
				onclick={() => (menuOffen = !menuOffen)}
			>
				{#if menuOffen}
					<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="h-6 w-6">
						<path stroke-linecap="round" stroke-linejoin="round" d="M6 6l12 12M18 6L6 18" />
					</svg>
				{:else}
					<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="h-6 w-6">
						<path stroke-linecap="round" stroke-linejoin="round" d="M4 7h16M4 12h16M4 17h16" />
					</svg>
				{/if}
			</button>
		</div>
	</header>

	<!-- Mobile: Menü-Overlay -->
	{#if menuOffen}
		<div class="fixed inset-x-0 top-16 bottom-0 z-40 md:hidden">
			<button
				type="button"
				class="absolute inset-0 h-full w-full bg-black/50"
				aria-label="Menü schließen"
				onclick={() => (menuOffen = false)}
			></button>
			<nav
				class="absolute top-0 right-0 flex h-full w-72 max-w-[80vw] flex-col gap-1 overflow-y-auto bg-white p-3 shadow-xl dark:bg-slate-900"
			>
				{#each nav as item (item.href)}
					<a
						href={item.href}
						class="rounded-xl px-4 py-3.5 text-base font-medium transition-colors {istAktiv(item.href)
							? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900'
							: 'text-slate-700 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-800'}"
					>
						{item.label}
					</a>
				{/each}
			</nav>
		</div>
	{/if}

	<main class="mx-auto max-w-5xl px-3 py-4 sm:px-4 sm:py-6">
		{@render children()}
	</main>
</div>
