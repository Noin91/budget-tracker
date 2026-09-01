<script lang="ts">
	import { enhance } from '$app/forms';
	import Card from '$lib/components/Card.svelte';

	let { data, form } = $props();

	type GroupType = 'income_fixed' | 'income_variable' | 'expense_fixed' | 'expense_variable';

	const gruppenLabel: Record<GroupType, string> = {
		income_fixed: 'Einnahmen (fix)',
		income_variable: 'Einnahmen (variabel)',
		expense_fixed: 'Ausgaben (fix)',
		expense_variable: 'Ausgaben (variabel)'
	};
</script>

<svelte:head>
	<title>Kategorien – Sparrate</title>
</svelte:head>

{#snippet renameForm(action: string, id: number, name: string)}
	<form method="POST" {action} use:enhance class="flex items-center gap-2">
		<input type="hidden" name="id" value={id} />
		<input
			type="text"
			name="name"
			value={name}
			class="h-11 w-full min-w-0 rounded-lg border border-slate-300 bg-white px-3 text-base dark:border-slate-700 dark:bg-slate-800"
		/>
		<button
			type="submit"
			class="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg border border-slate-300 text-slate-500 hover:text-slate-900 dark:border-slate-700 dark:hover:text-white"
			aria-label="Speichern"
		>
			✓
		</button>
	</form>
{/snippet}

<h1 class="mb-4 text-lg font-bold sm:mb-6 sm:text-xl">Kategorien</h1>

{#if form?.error}
	<div class="mb-4 rounded-xl border border-red-300 bg-red-50 px-4 py-2 text-sm text-red-700 dark:border-red-900 dark:bg-red-950 dark:text-red-300">
		{form.error}
	</div>
{/if}

<div class="grid grid-cols-1 gap-4 lg:grid-cols-2">
	{#each data.tree as group (group.id)}
		<Card title={gruppenLabel[group.type]}>
			<div class="space-y-3">
				{#each group.categories as category (category.id)}
					<div class="rounded-xl border border-slate-100 p-3 dark:border-slate-800">
						{@render renameForm('?/renameCategory', category.id, category.name)}

						{#if group.type === 'expense_fixed'}
							<div class="mt-2 ml-2 space-y-2 border-l border-slate-100 pl-2 sm:ml-4 sm:pl-3 dark:border-slate-800">
								{#each category.subcategories as sub (sub.id)}
									{@render renameForm('?/renameSubcategory', sub.id, sub.name)}
								{/each}
								<form method="POST" action="?/createSubcategory" use:enhance class="flex items-center gap-2">
									<input type="hidden" name="categoryId" value={category.id} />
									<input
										type="text"
										name="name"
										placeholder="Neue Unterkategorie"
										class="h-11 w-full min-w-0 rounded-lg border border-dashed border-slate-300 bg-white px-3 text-base dark:border-slate-700 dark:bg-slate-800"
									/>
									<button
										type="submit"
										class="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg border border-slate-300 dark:border-slate-700"
										aria-label="Unterkategorie hinzufügen"
									>
										+
									</button>
								</form>
							</div>
						{/if}
					</div>
				{/each}

				<form method="POST" action="?/createCategory" use:enhance class="flex items-center gap-2">
					<input type="hidden" name="groupId" value={group.id} />
					<input
						type="text"
						name="name"
						placeholder="Neue Kategorie"
						class="h-11 w-full min-w-0 rounded-lg border border-dashed border-slate-300 bg-white px-3 text-base dark:border-slate-700 dark:bg-slate-800"
					/>
					<button
						type="submit"
						class="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-slate-900 font-medium text-white dark:bg-white dark:text-slate-900"
						aria-label="Kategorie hinzufügen"
					>
						+
					</button>
				</form>
			</div>
		</Card>
	{/each}
</div>
