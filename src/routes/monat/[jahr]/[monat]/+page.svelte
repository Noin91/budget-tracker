<script lang="ts">
	import { enhance } from '$app/forms';
	import Card from '$lib/components/Card.svelte';
	import ProgressBar from '$lib/components/ProgressBar.svelte';
	import { MONATSNAMEN, formatEuro, formatProzent } from '$lib/calculations';

	let { data, form } = $props();

	const heuteIso = new Date().toISOString().slice(0, 10);

	const prevDate = $derived(new Date(data.jahr, data.monat - 2, 1));
	const nextDate = $derived(new Date(data.jahr, data.monat, 1));
	const prevHref = $derived(`/monat/${prevDate.getFullYear()}/${prevDate.getMonth() + 1}`);
	const nextHref = $derived(`/monat/${nextDate.getFullYear()}/${nextDate.getMonth() + 1}`);

	const restPositiv = $derived(data.dashboard.summary.restImMonat >= 0);
	const bilanzPositiv = $derived(data.dashboard.summary.bilanz >= 0);
	const sparrateErreicht = $derived(
		data.dashboard.summary.istSparrate >= data.dashboard.summary.sparzielProzent
	);
</script>

<svelte:head>
	<title>{MONATSNAMEN[data.monat - 1]} {data.jahr} – Sparrate</title>
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
	<h1 class="text-lg font-bold sm:text-xl">{MONATSNAMEN[data.monat - 1]} {data.jahr}</h1>
	<a
		href={nextHref}
		data-sveltekit-preload-data="off"
		class="flex h-11 w-11 items-center justify-center rounded-lg text-lg text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
		aria-label="Nächster Monat"
	>
		→
	</a>
</div>

<!-- Rest im Monat + Bilanz -->
<Card class="mb-4 sm:mb-6">
	<div class="flex items-baseline justify-between gap-2">
		<p class="text-sm font-medium text-slate-500 dark:text-slate-400">Rest im Monat verfügbar</p>
		<span
			class="rounded-full px-2 py-0.5 text-xs font-semibold {sparrateErreicht
				? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300'
				: 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300'}"
		>
			{formatProzent(data.dashboard.summary.istSparrate)} Sparrate
		</span>
	</div>
	<p class="mt-1 text-3xl font-extrabold sm:text-4xl {restPositiv ? 'text-emerald-500' : 'text-red-500'}">
		{formatEuro(data.dashboard.summary.restImMonat)}
	</p>
	<p class="mt-0.5 text-xs text-slate-400">(Sparaufteilung schon abgezogen)</p>
	<p class="mt-1 text-xs text-slate-400">
		von {formatEuro(data.dashboard.summary.verfuegbaresBudget)} Budget (nach Sparziel &amp; Fixkosten)
	</p>

	<div class="mt-4 border-t border-slate-100 pt-4 dark:border-slate-800">
		<p class="text-sm font-medium text-slate-500 dark:text-slate-400">Bilanz</p>
		<p class="mt-1 text-2xl font-bold sm:text-3xl {bilanzPositiv ? 'text-emerald-500' : 'text-red-500'}">
			{formatEuro(data.dashboard.summary.bilanz)}
		</p>
		<p class="mt-0.5 text-xs text-slate-400">Einnahmen − alle Ausgaben − Investment (10%) − Konto (20%)</p>
	</div>
</Card>

<!-- Schnelleingabe -->
<Card title="Neue variable Ausgabe" class="mb-4 sm:mb-6">
	{#if form?.error}
		<div class="mb-3 rounded-xl border border-red-300 bg-red-50 px-4 py-2 text-sm text-red-700 dark:border-red-900 dark:bg-red-950 dark:text-red-300">
			{form.error}
		</div>
	{/if}
	<form method="POST" action="?/addVariable" use:enhance class="grid grid-cols-2 gap-3 lg:flex lg:flex-wrap lg:items-end">
		<label class="col-span-2 text-sm sm:col-span-1 lg:w-44">
			Kategorie
			<select
				name="categoryId"
				class="mt-1 block h-11 w-full rounded-lg border border-slate-300 bg-white px-3 text-base dark:border-slate-700 dark:bg-slate-800"
			>
				<option value="" disabled selected>Wählen…</option>
				{#each data.dashboard.expenseVariable as { category } (category.id)}
					<option value={category.id}>{category.name}</option>
				{/each}
			</select>
		</label>
		<label class="col-span-2 text-sm sm:col-span-1 lg:flex-1">
			Name/Ort
			<input
				type="text"
				name="bezeichnung"
				placeholder="z.B. Kaufland"
				class="mt-1 block h-11 w-full rounded-lg border border-slate-300 bg-white px-3 text-base dark:border-slate-700 dark:bg-slate-800"
			/>
		</label>
		<label class="text-sm lg:w-28">
			Betrag
			<input
				type="number"
				inputmode="decimal"
				step="0.01"
				name="betrag"
				placeholder="0,00"
				class="mt-1 block h-11 w-full rounded-lg border border-slate-300 bg-white px-3 text-base dark:border-slate-700 dark:bg-slate-800"
			/>
		</label>
		<label class="text-sm lg:w-auto">
			Datum
			<input
				type="date"
				name="datum"
				value={heuteIso}
				class="mt-1 block h-11 w-full rounded-lg border border-slate-300 bg-white px-3 text-base dark:border-slate-700 dark:bg-slate-800"
			/>
		</label>
		<button
			type="submit"
			class="col-span-2 h-11 rounded-lg bg-slate-900 px-4 text-base font-medium text-white dark:bg-white dark:text-slate-900 lg:col-span-1 lg:w-auto"
		>
			Hinzufügen
		</button>
	</form>
</Card>

<!-- Variable Ausgaben gruppiert -->
<Card title="Variable Ausgaben diesen Monat" class="mb-4 sm:mb-6">
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
								<li class="flex items-center justify-between gap-2 py-2 text-sm">
									<span class="min-w-0 break-words">
										{tx.bezeichnung || '–'}
										{#if tx.datum}<span class="ml-1 text-xs text-slate-400">({tx.datum})</span>{/if}
									</span>
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
							{/each}
						</ul>
					</div>
				{/if}
			{/each}
		</div>
	{/if}
</Card>

<!-- Zusammenfassung -->
<div class="mb-4 grid grid-cols-1 gap-3 sm:mb-6 sm:grid-cols-3 sm:gap-4">
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

<Card title="Ist-Sparrate" class="mb-4 sm:mb-6">
	<ProgressBar value={data.dashboard.summary.istSparrate} target={data.dashboard.summary.sparzielProzent} />
</Card>

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
