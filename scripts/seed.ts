import { db } from './db';
import { categories, categoryGroups, savingsAllocations, subcategories } from '../src/lib/server/db/schema';
import type { CategoryGroupType } from '../src/lib/server/db/schema';

interface CategorySeed {
	name: string;
	subcategories?: string[];
}

const GROUPS: Record<CategoryGroupType, CategorySeed[]> = {
	income_fixed: [{ name: 'Gehalt' }, { name: 'Aktien' }],
	income_variable: [{ name: 'Variable Einnahmen' }],
	expense_fixed: [
		{
			name: 'Wohnen',
			subcategories: ['Miete', 'Strom', 'Internet', 'Hausratversicherung', 'GEZ', 'Versicherungen']
		},
		{ name: 'Sport', subcategories: ['Badminton', 'Cleverfit', 'Deutscher Alpenverein'] },
		{ name: 'Auto', subcategories: ['Versicherung', 'ADAC', 'Steuern'] },
		{
			name: 'Sonstige Verträge',
			subcategories: ['Apple Musik', 'Amazon', 'Handy', 'Netflix', 'Claude AI', 'Ing Diba', 'Dazn']
		}
	],
	expense_variable: [
		{ name: 'Lebensmittel' },
		{ name: 'Auto' },
		{ name: 'Kleidung' },
		{ name: 'Sonstiges' },
		{ name: 'Katzen' }
	]
};

const SAVINGS_ALLOCATIONS = [
	{ name: 'Investment', percent: 10 },
	{ name: 'Konto', percent: 20 },
	{ name: 'Reserve', percent: 20 }
];

async function seed() {
	let groupCount = 0;
	let categoryCount = 0;
	let subcategoryCount = 0;

	for (const type of Object.keys(GROUPS) as CategoryGroupType[]) {
		const [group] = await db
			.insert(categoryGroups)
			.values({ type })
			.onConflictDoNothing()
			.returning();
		const groupId =
			group?.id ??
			(await db.query.categoryGroups.findFirst({ where: (g, { eq }) => eq(g.type, type) }))!.id;
		if (group) groupCount++;

		for (const cat of GROUPS[type]) {
			const [category] = await db
				.insert(categories)
				.values({ groupId, name: cat.name })
				.onConflictDoNothing()
				.returning();
			const categoryId =
				category?.id ??
				(await db.query.categories.findFirst({
					where: (c, { and, eq }) => and(eq(c.groupId, groupId), eq(c.name, cat.name))
				}))!.id;
			if (category) categoryCount++;

			for (const subName of cat.subcategories ?? []) {
				const [sub] = await db
					.insert(subcategories)
					.values({ categoryId, name: subName })
					.onConflictDoNothing()
					.returning();
				if (sub) subcategoryCount++;
			}
		}
	}

	let allocationCount = 0;
	for (const allocation of SAVINGS_ALLOCATIONS) {
		const [inserted] = await db
			.insert(savingsAllocations)
			.values(allocation)
			.onConflictDoNothing()
			.returning();
		if (inserted) allocationCount++;
	}

	console.log(
		`Seed abgeschlossen: ${groupCount} neue Gruppen, ${categoryCount} neue Kategorien, ${subcategoryCount} neue Unterkategorien, ${allocationCount} neue Sparziel-Aufteilungen.`
	);
}

seed().then(() => process.exit(0));
