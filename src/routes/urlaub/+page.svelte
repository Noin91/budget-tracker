<script lang="ts">
	import { enhance } from '$app/forms';
	import Card from '$lib/components/Card.svelte';
	import { formatEuro } from '$lib/calculations';

	let { data, form } = $props();
</script>

<svelte:head>
	<title>Urlaub – Sparrate</title>
</svelte:head>

<h1 class="mb-4 text-lg font-bold sm:mb-6 sm:text-xl">Urlaub</h1>
<p class="-mt-3 mb-4 text-xs text-slate-400 sm:-mt-5 sm:mb-6">
	Reine Übersicht – wird nicht von den Einnahmen abgezogen und fließt nicht in die Sparrate ein.
</p>

<Card title="Neuer Urlaub" class="mb-4 sm:mb-6">
	{#if form?.error}
		<div class="mb-3 rounded-xl border border-red-300 bg-red-50 px-4 py-2 text-sm text-red-700 dark:border-red-900 dark:bg-red-950 dark:text-red-300">
			{form.error}
		</div>
	{/if}
	<form
		method="POST"
		action="?/createVacation"
		use:enhance
		class="grid grid-cols-2 gap-3 lg:flex lg:flex-wrap lg:items-end"
	>
		<label class="col-span-2 text-sm sm:col-span-1 lg:flex-1">
			Name
			<input
				type="text"
				name="name"
				placeholder="z.B. Italien 2026"
				required
				class="mt-1 block h-11 w-full rounded-lg border border-slate-300 bg-white px-3 text-base dark:border-slate-700 dark:bg-slate-800"
			/>
		</label>
		<label class="text-sm lg:w-auto">
			Datum
			<input
				type="date"
				name="datum"
				class="mt-1 block h-11 w-full rounded-lg border border-slate-300 bg-white px-3 text-base dark:border-slate-700 dark:bg-slate-800"
			/>
		</label>
		<button
			type="submit"
			class="col-span-2 h-11 rounded-lg bg-slate-900 px-4 text-base font-medium text-white dark:bg-white dark:text-slate-900 lg:col-span-1 lg:w-auto"
		>
			Urlaub hinzufügen
		</button>
	</form>
</Card>

{#if data.vacations.length === 0}
	<Card>
		<p class="text-sm text-slate-400">Noch kein Urlaub angelegt.</p>
	</Card>
{:else}
	<div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
		{#each data.vacations as vacation (vacation.id)}
			<a href="/urlaub/{vacation.id}" class="block">
				<Card class="h-full transition-colors hover:border-slate-300 dark:hover:border-slate-700">
					<div class="flex items-start justify-between gap-2">
						<div>
							<p class="font-semibold">{vacation.name}</p>
							{#if vacation.datum}<p class="text-xs text-slate-400">{vacation.datum}</p>{/if}
						</div>
						<p class="text-lg font-bold">{formatEuro(vacation.total)}</p>
					</div>
					<p class="mt-2 text-xs text-slate-400">
						{vacation.expenses.length}
						{vacation.expenses.length === 1 ? 'Ausgabe' : 'Ausgaben'}
					</p>
				</Card>
			</a>
		{/each}
	</div>
{/if}
