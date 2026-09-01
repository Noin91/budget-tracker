<script lang="ts">
	import { formatProzent } from '$lib/calculations';

	let { value, target = 0.5 }: { value: number; target?: number } = $props();

	// Skala bis mindestens 100%, damit das Ziel bei negativer oder sehr hoher Sparrate sichtbar bleibt
	const skalaMax = $derived(Math.max(1, value * 1.1));
	const gefuellt = $derived(Math.max(0, Math.min(1, value / skalaMax)) * 100);
	const zielPosition = $derived(Math.max(0, Math.min(1, target / skalaMax)) * 100);
	const zielErreicht = $derived(value >= target);
</script>

<div class="w-full">
	<div class="mb-1.5 flex items-baseline justify-between">
		<span class="text-2xl font-bold {zielErreicht ? 'text-emerald-500' : 'text-amber-500'}">
			{formatProzent(value)}
		</span>
		<span class="text-xs text-slate-500 dark:text-slate-400">Ziel: {formatProzent(target)}</span>
	</div>
	<div class="relative h-3 w-full overflow-visible rounded-full bg-slate-100 dark:bg-slate-800">
		<div
			class="h-3 rounded-full transition-all {zielErreicht ? 'bg-emerald-500' : 'bg-amber-500'}"
			style="width: {gefuellt}%"
		></div>
		<div
			class="absolute top-1/2 h-5 w-0.5 -translate-y-1/2 bg-slate-400 dark:bg-slate-500"
			style="left: {zielPosition}%"
			title="Sparziel"
		></div>
	</div>
</div>
