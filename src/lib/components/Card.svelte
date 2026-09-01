<script lang="ts">
	import type { Snippet } from 'svelte';

	let {
		title,
		class: className = '',
		children
	}: { title?: string; class?: string; children: Snippet } = $props();
</script>

<div
	class="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5 dark:border-slate-800 dark:bg-slate-900 {className}"
>
	{#if title}
		<h2 class="mb-3 text-sm font-semibold tracking-wide text-slate-500 uppercase dark:text-slate-400">
			{title}
		</h2>
	{/if}
	{@render children()}
</div>
