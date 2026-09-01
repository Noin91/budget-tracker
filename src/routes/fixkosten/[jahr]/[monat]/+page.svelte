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
	<form method="POST" action="?/setFixed" use:enhance class="flex flex-wrap items-center justify-between gap-x-3 gap-y-2 py-2">
		<span class="min-w-0 text-sm">{label}</span>
		<span class="ml-auto flex items-center gap-2">
			<input type="hidden" name="categoryId" value={categoryId} />
			{#if subcategoryId !== null}
				<input type="hidden" name="subcategoryId" value={subcategoryId} />
			{/if}
			<input
				type="number"
				inputmode="decimal"
				step="0.01"
				name="betrag"
				value={betrag ?? ''}
				placeholder="0,00"
				class="h-11 w-28 rounded-lg border border-slate-300 bg-white px-2 text-right text-base dark:border-slate-700 dark:bg-slate-800"
			/>
			<button
				type="submit"
				class="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg border border-slate-300 text-slate-500 hover:text-slate-900 dark:border-slate-700 dark:hover:text-white"
				aria-label="Speichern"
			>
				✓
			</button>
		</span>
	</form>
{/snippet}

<div class="mb-4 flex items-center justify-between sm:mb-6">
	<a
		href={prevHref}
		data-sveltekit-preload-data="off"
		class="flex h-11 w-11 items-center justify-center rounded-lg text-lg text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
		aria-label="Vorheriger Monat"
	>
		←
	</a>
	<h1 class="text-lg font-bold sm:text-xl">Fixkosten – {MONATSNAMEN[data.monat - 1]} {data.jahr}</h1>
	<a
		href={nextHref}
		data-sveltekit-preload-data="off"
		class="flex h-11 w-11 items-center justify-center rounded-lg text-lg text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
		aria-label="Nächster Monat"
	>
		→
	</a>
</div>

{#if form?.error}
	<div class="mb-4 rounded-xl border border-red-300 bg-red-50 px-4 py-2 text-sm text-red-700 dark:border-red-900 dark:bg-red-950 dark:text-red-300">
		{form.error}
	</div>
{/if}

<p class="mb-4 text-sm text-slate-500 sm:mb-6 dark:text-slate-400">
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
