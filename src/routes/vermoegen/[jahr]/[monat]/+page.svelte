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
					maintainAspectRatio: false,
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

<div class="mb-4 flex items-center justify-between sm:mb-6">
	<a
		href={prevHref}
		data-sveltekit-preload-data="off"
		class="flex h-11 w-11 items-center justify-center rounded-lg text-lg text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
		aria-label="Vorheriger Monat"
	>
		←
	</a>
	<h1 class="text-lg font-bold sm:text-xl">Vermögen – {MONATSNAMEN[data.monat - 1]} {data.jahr}</h1>
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

<Card class="mb-4 sm:mb-6">
	<p class="text-sm font-medium text-slate-500 dark:text-slate-400">Gesamtvermögen</p>
	<p class="mt-1 text-3xl font-extrabold text-emerald-500 sm:text-4xl">{formatEuro(data.vermoegen.total)}</p>
	<p class="mt-1 text-xs text-slate-400">Stand {MONATSNAMEN[data.monat - 1]} {data.jahr} (letzter erfasster Wert je Konto)</p>
</Card>

<div class="grid grid-cols-1 gap-4 lg:grid-cols-2">
	<Card title="Konten">
		<div class="divide-y divide-slate-100 dark:divide-slate-800">
			{#each data.vermoegen.items as { account, betrag } (account.id)}
				<form method="POST" action="?/setBalance" use:enhance class="flex flex-wrap items-center justify-between gap-x-3 gap-y-2 py-2">
					<span class="min-w-0 text-sm">{account.name}</span>
					<span class="ml-auto flex items-center gap-2">
						<input type="hidden" name="accountId" value={account.id} />
						<input
							type="number"
							inputmode="decimal"
							step="0.01"
							name="betrag"
							value={betrag}
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
			{:else}
				<p class="py-2 text-sm text-slate-400">Noch keine Konten angelegt.</p>
			{/each}
		</div>

		<form method="POST" action="?/createAccount" use:enhance class="mt-3 flex items-center gap-2">
			<input
				type="text"
				name="name"
				placeholder="Neues Konto"
				class="h-11 w-full min-w-0 rounded-lg border border-dashed border-slate-300 bg-white px-3 text-base dark:border-slate-700 dark:bg-slate-800"
			/>
			<button
				type="submit"
				class="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-slate-900 font-medium text-white dark:bg-white dark:text-slate-900"
				aria-label="Konto hinzufügen"
			>
				+
			</button>
		</form>
	</Card>

	<Card title="Verlauf">
		{#if data.history.length === 0}
			<p class="text-sm text-slate-400">Noch keine Daten vorhanden.</p>
		{:else}
			<div class="overflow-x-auto">
				<div class="h-64 w-full min-w-[560px] sm:h-72">
					<canvas bind:this={canvas}></canvas>
				</div>
			</div>
		{/if}
	</Card>
</div>
