<script lang="ts">
	import { enhance } from '$app/forms';
	import Card from '$lib/components/Card.svelte';
	import { MONATSNAMEN, formatEuro } from '$lib/calculations';

	let { data, form } = $props();

	const prevDate = $derived(new Date(data.jahr, data.monat - 2, 1));
	const nextDate = $derived(new Date(data.jahr, data.monat, 1));
	const prevHref = $derived(`/fixkosten/${prevDate.getFullYear()}/${prevDate.getMonth() + 1}`);
	const nextHref = $derived(`/fixkosten/${nextDate.getFullYear()}/${nextDate.getMonth() + 1}`);
</script>

<svelte:head>
	<title>Fixkosten {MONATSNAMEN[data.monat - 1]} {data.jahr} – Sparrate</title>
</svelte:head>

{#snippet fixedRow(
	label: string,
	categoryId: number,
	subcategoryId: number | null,
	betrag: number | null
)}
	<form method="POST" action="?/setFixed" use:enhance class="flex items-center justify-between gap-2 py-1.5">
		<span class="text-sm">{label}</span>
		<span class="flex items-center gap-1.5">
			<input type="hidden" name="categoryId" value={categoryId} />
			{#if subcategoryId !== null}
				<input type="hidden" name="subcategoryId" value={subcategoryId} />
			{/if}
			<input
				type="number"
				step="0.01"
				name="betrag"
				value={betrag ?? ''}
				placeholder="0,00"
				class="w-28 rounded-lg border border-slate-300 bg-white px-2 py-1 text-right text-sm dark:border-slate-700 dark:bg-slate-800"
			/>
			<button
				type="submit"
				class="rounded-lg border border-slate-300 px-2 py-1 text-xs text-slate-500 hover:text-slate-900 dark:border-slate-700 dark:hover:text-white"
			>
				✓
			</button>
		</span>
	</form>
{/snippet}

<div class="mb-6 flex items-center justify-between">
	<a href={prevHref} data-sveltekit-preload-data="off" class="rounded-lg px-2 py-1 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800">←</a>
	<h1 class="text-xl font-bold">Fixkosten – {MONATSNAMEN[data.monat - 1]} {data.jahr}</h1>
	<a href={nextHref} data-sveltekit-preload-data="off" class="rounded-lg px-2 py-1 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800">→</a>
</div>

{#if form?.error}
	<div class="mb-4 rounded-xl border border-red-300 bg-red-50 px-4 py-2 text-sm text-red-700 dark:border-red-900 dark:bg-red-950 dark:text-red-300">
		{form.error}
	</div>
{/if}

<p class="mb-6 text-sm text-slate-500 dark:text-slate-400">
	Summe Fixkosten: <span class="font-semibold text-slate-900 dark:text-slate-100">{formatEuro(data.dashboard.fixkostenSumme)}</span>
</p>

<div class="grid grid-cols-1 gap-4 lg:grid-cols-2">
	{#each data.dashboard.expenseFixed as { category, subcategoryValues, direktTransaktion } (category.id)}
		<Card title={category.name}>
			{#if subcategoryValues.length > 0}
				<div class="divide-y divide-slate-100 dark:divide-slate-800">
					{#each subcategoryValues as { subcategory, transaction } (subcategory.id)}
						{@render fixedRow(subcategory.name, category.id, subcategory.id, transaction?.betrag ?? null)}
					{/each}
				</div>
			{:else}
				{@render fixedRow(category.name, category.id, null, direktTransaktion?.betrag ?? null)}
			{/if}
		</Card>
	{/each}
</div>
