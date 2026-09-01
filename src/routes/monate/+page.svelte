<script lang="ts">
	import { goto } from '$app/navigation';
	import Card from '$lib/components/Card.svelte';
	import { MONATSNAMEN, formatEuro, formatProzent } from '$lib/calculations';

	let { data } = $props();

	const jetzt = new Date();
	let jahr = $state(jetzt.getFullYear());
	let monat = $state(jetzt.getMonth() + 1);

	const jahresOptionen = $derived(
		Array.from({ length: 6 }, (_, i) => jetzt.getFullYear() - 2 + i)
	);

	function oeffnen() {
		goto(`/monat/${jahr}/${monat}`);
	}
</script>

<svelte:head>
	<title>Monate – Sparrate</title>
</svelte:head>

<h1 class="mb-6 text-xl font-bold">Monate</h1>

<Card title="Monat anlegen / auswählen" class="mb-6">
	<div class="flex flex-wrap items-end gap-2">
		<label class="text-sm">
			Jahr
			<select
				bind:value={jahr}
				class="mt-1 block rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm dark:border-slate-700 dark:bg-slate-800"
			>
				{#each jahresOptionen as j (j)}
					<option value={j}>{j}</option>
				{/each}
			</select>
		</label>
		<label class="text-sm">
			Monat
			<select
				bind:value={monat}
				class="mt-1 block rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm dark:border-slate-700 dark:bg-slate-800"
			>
				{#each MONATSNAMEN as name, i (name)}
					<option value={i + 1}>{name}</option>
				{/each}
			</select>
		</label>
		<button
			type="button"
			onclick={oeffnen}
			class="rounded-lg bg-slate-900 px-4 py-1.5 text-sm font-medium text-white dark:bg-white dark:text-slate-900"
		>
			Öffnen
		</button>
	</div>
</Card>

<Card title="Vorhandene Monate">
	{#if data.history.length === 0}
		<p class="text-sm text-slate-400">Noch keine Monate angelegt.</p>
	{:else}
		<div class="overflow-x-auto">
			<table class="w-full text-sm">
				<thead>
					<tr class="border-b border-slate-200 text-left text-slate-500 dark:border-slate-800 dark:text-slate-400">
						<th class="py-1.5 pr-2 font-medium">Monat</th>
						<th class="py-1.5 pr-2 text-right font-medium">Gesamteinkommen</th>
						<th class="py-1.5 pr-2 text-right font-medium">Ist-Sparrate</th>
						<th class="py-1.5 pr-2 text-right font-medium">Rest</th>
					</tr>
				</thead>
				<tbody class="divide-y divide-slate-100 dark:divide-slate-800">
					{#each data.history as { month, summary } (month.id)}
						<tr>
							<td class="py-1.5 pr-2">
								<a
									href="/monat/{month.jahr}/{month.monat}"
									class="font-medium text-slate-900 hover:underline dark:text-slate-100"
								>
									{MONATSNAMEN[month.monat - 1]} {month.jahr}
								</a>
							</td>
							<td class="py-1.5 pr-2 text-right">{formatEuro(summary.gesamteinkommen)}</td>
							<td
								class="py-1.5 pr-2 text-right font-medium {summary.istSparrate >= summary.sparzielProzent
									? 'text-emerald-500'
									: 'text-amber-500'}"
							>
								{formatProzent(summary.istSparrate)}
							</td>
							<td class="py-1.5 pr-2 text-right">{formatEuro(summary.restImMonat)}</td>
						</tr>
					{/each}
				</tbody>
			</table>
		</div>
	{/if}
</Card>
