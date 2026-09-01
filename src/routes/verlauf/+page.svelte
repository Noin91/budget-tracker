<script lang="ts">
	import { onMount } from 'svelte';
	import Card from '$lib/components/Card.svelte';
	import { MONATSNAMEN, formatEuro, formatProzent } from '$lib/calculations';
	import type { Chart as ChartType } from 'chart.js';

	let { data } = $props();

	let canvas: HTMLCanvasElement | undefined = $state();
	let chart: ChartType | undefined;

	const labels = $derived(
		data.history.map(({ month }) => `${MONATSNAMEN[month.monat - 1].slice(0, 3)} ${month.jahr}`)
	);
	const sparratenWerte = $derived(data.history.map(({ summary }) => summary.istSparrate * 100));
	const zielProzent = $derived((data.history.at(-1)?.summary.sparzielProzent ?? 0.5) * 100);

	onMount(() => {
		let aktiv = true;

		(async () => {
			const { Chart } = await import('chart.js/auto');
			if (!aktiv || !canvas) return;
			chart = new Chart(canvas, {
				type: 'line',
				data: {
					labels,
					datasets: [
						{
							label: 'Ist-Sparrate',
							data: sparratenWerte,
							borderColor: '#10b981',
							backgroundColor: '#10b98133',
							tension: 0.25,
							fill: true
						},
						{
							label: `Ziel (${zielProzent}%)`,
							data: labels.map(() => zielProzent),
							borderColor: '#94a3b8',
							borderDash: [6, 6],
							pointRadius: 0,
							fill: false
						}
					]
				},
				options: {
					responsive: true,
					scales: {
						y: { ticks: { callback: (v) => `${v}%` } }
					}
				}
			});
		})();

		return () => {
			aktiv = false;
			chart?.destroy();
			chart = undefined;
		};
	});

	$effect(() => {
		const currentLabels = labels;
		const currentValues = sparratenWerte;
		if (chart) {
			chart.data.labels = currentLabels;
			chart.data.datasets[0].data = currentValues;
			chart.data.datasets[1].data = currentLabels.map(() => zielProzent);
			chart.update();
		}
	});
</script>

<svelte:head>
	<title>Verlauf – Sparrate</title>
</svelte:head>

<h1 class="mb-6 text-xl font-bold">Verlauf</h1>

<Card title="Sparrate über die Zeit" class="mb-6">
	{#if data.history.length === 0}
		<p class="text-sm text-slate-400">Noch keine Daten vorhanden.</p>
	{:else}
		<canvas bind:this={canvas} class="max-h-80"></canvas>
	{/if}
</Card>

{#if data.history.length > 0}
	<Card title="Monatsübersicht">
		<div class="overflow-x-auto">
			<table class="w-full text-sm">
				<thead>
					<tr class="border-b border-slate-200 text-left text-slate-500 dark:border-slate-800 dark:text-slate-400">
						<th class="py-1.5 pr-2 font-medium">Monat</th>
						<th class="py-1.5 pr-2 text-right font-medium">Einkommen</th>
						<th class="py-1.5 pr-2 text-right font-medium">Fixkosten</th>
						<th class="py-1.5 pr-2 text-right font-medium">Variabel</th>
						<th class="py-1.5 pr-2 text-right font-medium">Ist-Sparrate</th>
						<th class="py-1.5 text-right font-medium">Rest</th>
					</tr>
				</thead>
				<tbody class="divide-y divide-slate-100 dark:divide-slate-800">
					{#each data.history as { month, summary, fixkostenSumme, variableAusgabenSumme } (month.id)}
						<tr>
							<td class="py-1.5 pr-2">
								<a href="/monat/{month.jahr}/{month.monat}" class="hover:underline">
									{MONATSNAMEN[month.monat - 1]} {month.jahr}
								</a>
							</td>
							<td class="py-1.5 pr-2 text-right">{formatEuro(summary.gesamteinkommen)}</td>
							<td class="py-1.5 pr-2 text-right">{formatEuro(fixkostenSumme)}</td>
							<td class="py-1.5 pr-2 text-right">{formatEuro(variableAusgabenSumme)}</td>
							<td
								class="py-1.5 pr-2 text-right font-medium {summary.istSparrate >= summary.sparzielProzent
									? 'text-emerald-500'
									: 'text-amber-500'}"
							>
								{formatProzent(summary.istSparrate)}
							</td>
							<td class="py-1.5 text-right">{formatEuro(summary.restImMonat)}</td>
						</tr>
					{/each}
				</tbody>
			</table>
		</div>
	</Card>
{/if}
