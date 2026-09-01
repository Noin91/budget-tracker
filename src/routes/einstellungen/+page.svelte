<script lang="ts">
	import { enhance } from '$app/forms';
	import Card from '$lib/components/Card.svelte';

	let { data, form } = $props();

	const summe = $derived(data.allocations.reduce((s, a) => s + a.percent, 0));
</script>

<svelte:head>
	<title>Einstellungen – Sparrate</title>
</svelte:head>

<h1 class="mb-6 text-xl font-bold">Einstellungen</h1>

{#if form?.error}
	<div class="mb-4 rounded-xl border border-red-300 bg-red-50 px-4 py-2 text-sm text-red-700 dark:border-red-900 dark:bg-red-950 dark:text-red-300">
		{form.error}
	</div>
{/if}

<Card title="Sparziel-Aufteilung">
	<p class="mb-4 text-sm text-slate-500 dark:text-slate-400">
		Konfiguriere, wie das monatliche Sparziel prozentual auf Investment, Konto und Reserve
		aufgeteilt wird. Die Summe ergibt dein Gesamt-Sparziel (Standard: 50 %).
	</p>

	<div class="space-y-3">
		{#each data.allocations as allocation (allocation.id)}
			<form method="POST" action="?/updateAllocation" use:enhance class="flex items-center justify-between gap-2">
				<input type="hidden" name="id" value={allocation.id} />
				<span class="text-sm font-medium">{allocation.name}</span>
				<span class="flex items-center gap-1.5">
					<input
						type="number"
						step="0.1"
						min="0"
						max="100"
						name="percent"
						value={allocation.percent}
						class="w-20 rounded-lg border border-slate-300 bg-white px-2 py-1 text-right text-sm dark:border-slate-700 dark:bg-slate-800"
					/>
					<span class="text-sm text-slate-400">%</span>
					<button
						type="submit"
						class="rounded-lg border border-slate-300 px-2 py-1 text-xs text-slate-500 hover:text-slate-900 dark:border-slate-700 dark:hover:text-white"
					>
						✓
					</button>
				</span>
			</form>
		{/each}
	</div>

	<div class="mt-4 border-t border-slate-100 pt-3 text-sm dark:border-slate-800">
		Gesamt-Sparziel: <span class="font-semibold">{summe}%</span>
	</div>
</Card>
