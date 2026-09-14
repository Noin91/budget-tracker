<script lang="ts">
	import { enhance } from '$app/forms';
	import Card from '$lib/components/Card.svelte';
	import { formatEuro } from '$lib/calculations';

	let { data, form } = $props();

	const heuteIso = new Date().toISOString().slice(0, 10);
</script>

<svelte:head>
	<title>{data.vacation.name} – Urlaub – Sparrate</title>
</svelte:head>

<a
	href="/urlaub"
	class="mb-4 inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-900 sm:mb-6 dark:hover:text-white"
>
	← Zurück zur Übersicht
</a>

{#if form?.error}
	<div class="mb-4 rounded-xl border border-red-300 bg-red-50 px-4 py-2 text-sm text-red-700 dark:border-red-900 dark:bg-red-950 dark:text-red-300">
		{form.error}
	</div>
{/if}

<Card title="Urlaub bearbeiten" class="mb-4 sm:mb-6">
	<form
		method="POST"
		action="?/rename"
		use:enhance
		class="grid grid-cols-2 gap-3 lg:flex lg:flex-wrap lg:items-end"
	>
		<label class="col-span-2 text-sm sm:col-span-1 lg:flex-1">
			Name
			<input
				type="text"
				name="name"
				value={data.vacation.name}
				required
				class="mt-1 block h-11 w-full rounded-lg border border-slate-300 bg-white px-3 text-base dark:border-slate-700 dark:bg-slate-800"
			/>
		</label>
		<label class="text-sm lg:w-auto">
			Datum
			<input
				type="date"
				name="datum"
				value={data.vacation.datum ?? ''}
				class="mt-1 block h-11 w-full rounded-lg border border-slate-300 bg-white px-3 text-base dark:border-slate-700 dark:bg-slate-800"
			/>
		</label>
		<button
			type="submit"
			class="col-span-2 h-11 rounded-lg bg-slate-900 px-4 text-base font-medium text-white dark:bg-white dark:text-slate-900 lg:col-span-1 lg:w-auto"
		>
			Speichern
		</button>
	</form>

	<form method="POST" action="?/deleteVacation" use:enhance class="mt-3">
		<button type="submit" class="text-sm text-red-500 hover:text-red-600"> Urlaub löschen </button>
	</form>
</Card>

<Card class="mb-4 sm:mb-6">
	<p class="text-sm font-medium text-slate-500 dark:text-slate-400">Gesamtkosten</p>
	<p class="mt-1 text-3xl font-extrabold sm:text-4xl">{formatEuro(data.total)}</p>
</Card>

<Card title="Kosten hinzufügen" class="mb-4 sm:mb-6">
	<form
		method="POST"
		action="?/addExpense"
		use:enhance
		class="grid grid-cols-2 gap-3 lg:flex lg:flex-wrap lg:items-end"
	>
		<label class="col-span-2 text-sm sm:col-span-1 lg:flex-1">
			Name/Ort
			<input
				type="text"
				name="bezeichnung"
				placeholder="z.B. Flug"
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

<Card title="Kosten">
	{#if data.vacation.expenses.length === 0}
		<p class="text-sm text-slate-400">Noch keine Kosten erfasst.</p>
	{:else}
		<ul class="divide-y divide-slate-100 dark:divide-slate-800">
			{#each data.vacation.expenses as expense (expense.id)}
				<li class="flex items-center justify-between gap-2 py-2 text-sm">
					<span class="min-w-0 break-words">
						{expense.bezeichnung || '–'}
						{#if expense.datum}<span class="ml-1 text-xs text-slate-400">({expense.datum})</span>{/if}
					</span>
					<span class="flex shrink-0 items-center gap-1">
						<span class="font-medium">{formatEuro(expense.betrag)}</span>
						<form method="POST" action="?/deleteExpense" use:enhance>
							<input type="hidden" name="id" value={expense.id} />
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
	{/if}
</Card>
