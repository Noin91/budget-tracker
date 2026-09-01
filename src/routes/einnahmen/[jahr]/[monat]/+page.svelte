<script lang="ts">
	import { enhance } from '$app/forms';
	import Card from '$lib/components/Card.svelte';
	import { MONATSNAMEN, formatEuro } from '$lib/calculations';

	let { data, form } = $props();

	const prevDate = $derived(new Date(data.jahr, data.monat - 2, 1));
	const nextDate = $derived(new Date(data.jahr, data.monat, 1));
	const prevHref = $derived(`/einnahmen/${prevDate.getFullYear()}/${prevDate.getMonth() + 1}`);
	const nextHref = $derived(`/einnahmen/${nextDate.getFullYear()}/${nextDate.getMonth() + 1}`);
</script>

<svelte:head>
	<title>Einnahmen {MONATSNAMEN[data.monat - 1]} {data.jahr} – Sparrate</title>
</svelte:head>

<div class="mb-4 flex items-center justify-between sm:mb-6">
	<a
		href={prevHref}
		data-sveltekit-preload-data="off"
		class="flex h-11 w-11 items-center justify-center rounded-lg text-lg text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
		aria-label="Vorheriger Monat"
	>
		←
	</a>
	<h1 class="text-lg font-bold sm:text-xl">Einnahmen – {MONATSNAMEN[data.monat - 1]} {data.jahr}</h1>
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
	Gesamteinkommen: <span class="font-semibold text-slate-900 dark:text-slate-100">{formatEuro(data.dashboard.summary.gesamteinkommen)}</span>
</p>

<div class="grid grid-cols-1 gap-4 lg:grid-cols-2">
	<Card title="Fixe Einnahmen">
		<div class="divide-y divide-slate-100 dark:divide-slate-800">
			{#each data.dashboard.incomeFixed as { category, transaction } (category.id)}
				<form method="POST" action="?/setFixed" use:enhance class="flex flex-wrap items-center justify-between gap-x-3 gap-y-2 py-2">
					<span class="min-w-0 text-sm">{category.name}</span>
					<span class="ml-auto flex items-center gap-2">
						<input type="hidden" name="categoryId" value={category.id} />
						<input
							type="number"
							inputmode="decimal"
							step="0.01"
							name="betrag"
							value={transaction?.betrag ?? ''}
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
			{/each}
		</div>
	</Card>

	<Card title="Variable Einnahmen">
		{#each data.dashboard.incomeVariable as { category, transactions: txs } (category.id)}
			<form method="POST" action="?/addVariable" use:enhance class="mb-3 grid grid-cols-2 gap-2">
				<input type="hidden" name="categoryId" value={category.id} />
				<input
					type="text"
					name="bezeichnung"
					placeholder="Bezeichnung"
					class="col-span-2 h-11 rounded-lg border border-slate-300 bg-white px-3 text-base dark:border-slate-700 dark:bg-slate-800"
				/>
				<input
					type="number"
					inputmode="decimal"
					step="0.01"
					name="betrag"
					placeholder="0,00"
					required
					class="h-11 rounded-lg border border-slate-300 bg-white px-3 text-base dark:border-slate-700 dark:bg-slate-800"
				/>
				<button
					type="submit"
					class="h-11 rounded-lg border border-slate-300 text-sm font-medium dark:border-slate-700"
				>
					Hinzufügen
				</button>
			</form>
			<ul class="divide-y divide-slate-100 dark:divide-slate-800">
				{#each txs as tx (tx.id)}
					<li class="flex items-center justify-between gap-2 py-2 text-sm">
						<span class="min-w-0 break-words">{tx.bezeichnung || '–'}</span>
						<span class="flex shrink-0 items-center gap-1">
							<span class="font-medium">{formatEuro(tx.betrag)}</span>
							<form method="POST" action="?/deleteTransaction" use:enhance>
								<input type="hidden" name="id" value={tx.id} />
								<button
									type="submit"
									class="flex h-11 w-11 items-center justify-center text-slate-400 hover:text-red-500"
									aria-label="Löschen"
								>
									✕
								</button>
							</form>
						</span>
					</li>
				{:else}
					<li class="py-2 text-sm text-slate-400">Keine Einträge</li>
				{/each}
			</ul>
		{/each}
	</Card>
</div>
