<script lang="ts">
	import { enhance } from '$app/forms';
	import Card from '$lib/components/Card.svelte';
	import ProgressBar from '$lib/components/ProgressBar.svelte';
	import { MONATSNAMEN, formatEuro } from '$lib/calculations';

	let { data, form } = $props();

	const heuteIso = new Date().toISOString().slice(0, 10);

	const prevDate = $derived(new Date(data.jahr, data.monat - 2, 1));
	const nextDate = $derived(new Date(data.jahr, data.monat, 1));
	const prevHref = $derived(`/monat/${prevDate.getFullYear()}/${prevDate.getMonth() + 1}`);
	const nextHref = $derived(`/monat/${nextDate.getFullYear()}/${nextDate.getMonth() + 1}`);

	const restPositiv = $derived(data.dashboard.summary.restImMonat >= 0);
</script>

<svelte:head>
	<title>{MONATSNAMEN[data.monat - 1]} {data.jahr} – Sparrate</title>
</svelte:head>

<div class="mb-6 flex items-center justify-between">
	<a href={prevHref} data-sveltekit-preload-data="off" class="rounded-lg px-2 py-1 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800">←</a>
	<h1 class="text-xl font-bold">{MONATSNAMEN[data.monat - 1]} {data.jahr}</h1>
	<a href={nextHref} data-sveltekit-preload-data="off" class="rounded-lg px-2 py-1 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800">→</a>
</div>

{#if form?.error}
	<div class="mb-4 rounded-xl border border-red-300 bg-red-50 px-4 py-2 text-sm text-red-700 dark:border-red-900 dark:bg-red-950 dark:text-red-300">
		{form.error}
	</div>
{/if}

<!-- Schnelleingabe -->
<Card title="Neue variable Ausgabe" class="mb-6">
	<form method="POST" action="?/addVariable" use:enhance class="flex flex-wrap items-end gap-2">
		<label class="w-40 text-sm">
			Kategorie
			<select
				name="categoryId"
				required
				class="mt-1 block w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800"
			>
				<option value="" disabled selected>Wählen…</option>
				{#each data.dashboard.expenseVariable as { category } (category.id)}
					<option value={category.id}>{category.name}</option>
				{/each}
			</select>
		</label>
		<label class="flex-1 text-sm">
			Name/Ort
			<input
				type="text"
				name="bezeichnung"
				placeholder="z.B. Kaufland"
				class="mt-1 block w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800"
			/>
		</label>
		<label class="w-28 text-sm">
			Betrag
			<input
				type="number"
				step="0.01"
				name="betrag"
				placeholder="0,00"
				required
				class="mt-1 block w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800"
			/>
		</label>
		<label class="text-sm">
			Datum
			<input
				type="date"
				name="datum"
				value={heuteIso}
				class="mt-1 block rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800"
			/>
		</label>
		<button
			type="submit"
			class="rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white dark:bg-white dark:text-slate-900"
		>
			Hinzufügen
		</button>
	</form>
</Card>

<!-- Variable Ausgaben gruppiert -->
<Card title="Variable Ausgaben diesen Monat" class="mb-6">
	{#if data.dashboard.expenseVariable.every(({ transactions: txs }) => txs.length === 0)}
		<p class="text-sm text-slate-400">Noch keine variablen Ausgaben in diesem Monat.</p>
	{:else}
		<div class="grid grid-cols-1 gap-x-8 md:grid-cols-2">
			{#each data.dashboard.expenseVariable as { category, transactions: txs } (category.id)}
				{#if txs.length > 0}
					<div class="mb-4 last:mb-0">
						<p class="mb-2 flex items-center justify-between text-sm font-semibold text-slate-700 dark:text-slate-200">
							<span>{category.name}</span>
							<span class="text-slate-400">{formatEuro(txs.reduce((s, t) => s + t.betrag, 0))}</span>
						</p>
						<ul class="divide-y divide-slate-100 dark:divide-slate-800">
							{#each txs as tx (tx.id)}
								<li class="flex items-center justify-between py-1 text-sm">
									<span>
										{tx.bezeichnung || '–'}
										{#if tx.datum}<span class="ml-1 text-xs text-slate-400">({tx.datum})</span>{/if}
									</span>
									<span class="flex items-center gap-2">
										<span class="font-medium">{formatEuro(tx.betrag)}</span>
										<form method="POST" action="?/deleteTransaction" use:enhance>
											<input type="hidden" name="id" value={tx.id} />
											<button type="submit" class="text-slate-400 hover:text-red-500" aria-label="Löschen">✕</button>
										</form>
									</span>
								</li>
							{/each}
						</ul>
					</div>
				{/if}
			{/each}
		</div>
	{/if}
</Card>

<!-- Zusammenfassung -->
<div class="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
	<Card>
		<p class="text-sm text-slate-500 dark:text-slate-400">Einnahmen (gesamt)</p>
		<p class="mt-1 text-2xl font-bold">{formatEuro(data.dashboard.summary.gesamteinkommen)}</p>
	</Card>
	<Card>
		<p class="text-sm text-slate-500 dark:text-slate-400">Fixkosten (gesamt)</p>
		<p class="mt-1 text-2xl font-bold">{formatEuro(data.dashboard.fixkostenSumme)}</p>
	</Card>
	<Card>
		<p class="text-sm text-slate-500 dark:text-slate-400">Variable Kosten (bisher)</p>
		<p class="mt-1 text-2xl font-bold">{formatEuro(data.dashboard.variableAusgabenSumme)}</p>
	</Card>
</div>

<div class="mb-6 grid grid-cols-1 gap-4 md:grid-cols-2">
	<Card>
		<p class="text-sm font-medium text-slate-500 dark:text-slate-400">Rest im Monat verfügbar</p>
		<p class="mt-1 text-4xl font-extrabold {restPositiv ? 'text-emerald-500' : 'text-red-500'}">
			{formatEuro(data.dashboard.summary.restImMonat)}
		</p>
		<p class="mt-0.5 text-xs text-slate-400">(Sparaufteilung schon abgezogen)</p>
		<p class="mt-1 text-xs text-slate-400">
			von {formatEuro(data.dashboard.summary.verfuegbaresBudget)} Budget (nach Sparziel &amp; Fixkosten)
		</p>
	</Card>

	<Card title="Ist-Sparrate">
		<ProgressBar value={data.dashboard.summary.istSparrate} target={data.dashboard.summary.sparzielProzent} />
	</Card>
</div>

<Card title="Sparziel-Aufteilung">
	<div class="grid grid-cols-2 gap-3 sm:grid-flow-col sm:auto-cols-fr">
		{#each data.dashboard.summary.allocations as allocation (allocation.id)}
			<div class="rounded-xl bg-slate-50 p-3 text-center dark:bg-slate-800/60">
				<p class="text-xs text-slate-500 dark:text-slate-400">{allocation.name} ({allocation.percent}%)</p>
				<p class="mt-1 font-semibold text-emerald-500">{formatEuro(allocation.zielbetrag)}</p>
			</div>
		{/each}
	</div>
</Card>
