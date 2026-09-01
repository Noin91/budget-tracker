<script lang="ts">
	import { onMount } from 'svelte';
	import { enhance } from '$app/forms';
	import Card from '$lib/components/Card.svelte';
	import { MONATSNAMEN, formatEuro } from '$lib/calculations';
	import type { Chart as ChartType } from 'chart.js';

	let { data, form } = $props();

	const prevDate = $derived(new Date(data.jahr, data.monat - 2, 1));
	const nextDate = $derived(new Date(data.jahr, data.monat, 1));
	const prevHref = $derived(`/vermoegen/${prevDate.getFullYear()}/${prevDate.getMonth() + 1}`);
	const nextHref = $derived(`/vermoegen/${nextDate.getFullYear()}/${nextDate.getMonth() + 1}`);

	const FARBEN = [
		'#10b981',
		'#3b82f6',
		'#f59e0b',
		'#ef4444',
		'#8b5cf6',
		'#ec4899',
		'#14b8a6',
		'#f97316',
		'#6366f1',
		'#84cc16'
	];

	let canvas: HTMLCanvasElement | undefined = $state();
	let chart: ChartType | undefined;

	const labels = $derived(
		data.history.map(({ month }) => `${MONATSNAMEN[month.monat - 1].slice(0, 3)} ${month.jahr}`)
	);

	const datasets = $derived(
		data.accounts.map((account, i) => ({
			label: account.name,
			data: data.history.map((h) => h.perAccount.get(account.id) ?? 0),
			backgroundColor: FARBEN[i % FARBEN.length] + '99',
			borderColor: FARBEN[i % FARBEN.length],
			fill: true,
			stack: 'vermoegen',
			tension: 0.2,
			pointRadius: 0
		}))
	);

	onMount(() => {
		let aktiv = true;

		(async () => {
			const { Chart } = await import('chart.js/auto');
			if (!aktiv || !canvas) return;
			chart = new Chart(canvas, {
				type: 'line',
				data: { labels, datasets },
				options: {
					responsive: true,
					scales: {
						y: { stacked: true, ticks: { callback: (v) => formatEuro(Number(v)) } }
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
		const currentDatasets = datasets;
		if (chart) {
			chart.data.labels = currentLabels;
			chart.data.datasets = currentDatasets;
			chart.update();
		}
	});
</script>

<svelte:head>
	<title>Vermögen {MONATSNAMEN[data.monat - 1]} {data.jahr} – Sparrate</title>
</svelte:head>

<div class="mb-6 flex items-center justify-between">
	<a href={prevHref} data-sveltekit-preload-data="off" class="rounded-lg px-2 py-1 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800">←</a>
	<h1 class="text-xl font-bold">Vermögen – {MONATSNAMEN[data.monat - 1]} {data.jahr}</h1>
	<a href={nextHref} data-sveltekit-preload-data="off" class="rounded-lg px-2 py-1 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800">→</a>
</div>

{#if form?.error}
	<div class="mb-4 rounded-xl border border-red-300 bg-red-50 px-4 py-2 text-sm text-red-700 dark:border-red-900 dark:bg-red-950 dark:text-red-300">
		{form.error}
	</div>
{/if}

<Card class="mb-6">
	<p class="text-sm font-medium text-slate-500 dark:text-slate-400">Gesamtvermögen</p>
	<p class="mt-1 text-4xl font-extrabold text-emerald-500">{formatEuro(data.vermoegen.total)}</p>
	<p class="mt-1 text-xs text-slate-400">Stand {MONATSNAMEN[data.monat - 1]} {data.jahr} (letzter erfasster Wert je Konto)</p>
</Card>

<div class="grid grid-cols-1 gap-4 lg:grid-cols-2">
	<Card title="Konten">
		<div class="divide-y divide-slate-100 dark:divide-slate-800">
			{#each data.vermoegen.items as { account, betrag } (account.id)}
				<form method="POST" action="?/setBalance" use:enhance class="flex items-center justify-between gap-2 py-1.5">
					<span class="text-sm">{account.name}</span>
					<span class="flex items-center gap-1.5">
						<input type="hidden" name="accountId" value={account.id} />
						<input
							type="number"
							step="0.01"
							name="betrag"
							value={betrag}
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
			{:else}
				<p class="py-1 text-sm text-slate-400">Noch keine Konten angelegt.</p>
			{/each}
		</div>

		<form method="POST" action="?/createAccount" use:enhance class="mt-3 flex items-center gap-1.5">
			<input
				type="text"
				name="name"
				placeholder="Neues Konto"
				class="w-full rounded-lg border border-dashed border-slate-300 bg-white px-3 py-1.5 text-sm dark:border-slate-700 dark:bg-slate-800"
			/>
			<button
				type="submit"
				class="rounded-lg bg-slate-900 px-3 py-1.5 text-sm font-medium text-white dark:bg-white dark:text-slate-900"
			>
				+
			</button>
		</form>
	</Card>

	<Card title="Verlauf">
		{#if data.history.length === 0}
			<p class="text-sm text-slate-400">Noch keine Daten vorhanden.</p>
		{:else}
			<canvas bind:this={canvas} class="max-h-80"></canvas>
		{/if}
	</Card>
</div>
