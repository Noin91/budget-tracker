import { and, asc, desc, eq, isNull } from 'drizzle-orm';
import { db } from './index';
import {
	accountBalances,
	accounts,
	categories,
	months,
	savingsAllocations,
	subcategories,
	transactions,
	type CategoryGroupType
} from './schema';
import { berechneMonat, type MonthFinancialsResult } from '$lib/calculations';

// ---------- Monate ----------

export async function listMonths() {
	return db.query.months.findMany({
		orderBy: [desc(months.jahr), desc(months.monat)]
	});
}

export async function getMonthByYearMonth(jahr: number, monat: number) {
	return db.query.months.findFirst({
		where: and(eq(months.jahr, jahr), eq(months.monat, monat))
	});
}

export async function createMonth(jahr: number, monat: number) {
	const [created] = await db.insert(months).values({ jahr, monat }).returning();
	return created;
}

export async function getOrCreateMonth(jahr: number, monat: number) {
	const existing = await getMonthByYearMonth(jahr, monat);
	if (existing) return existing;
	return createMonth(jahr, monat);
}

// ---------- Kategorien ----------

export async function getCategoryTree() {
	return db.query.categoryGroups.findMany({
		with: {
			categories: {
				orderBy: asc(categories.name),
				with: { subcategories: { orderBy: asc(subcategories.name) } }
			}
		}
	});
}

export type CategoryTree = Awaited<ReturnType<typeof getCategoryTree>>;

export async function createCategory(groupId: number, name: string) {
	await db.insert(categories).values({ groupId, name });
}

export async function renameCategory(id: number, name: string) {
	await db.update(categories).set({ name }).where(eq(categories.id, id));
}

export async function createSubcategory(categoryId: number, name: string) {
	await db.insert(subcategories).values({ categoryId, name });
}

export async function renameSubcategory(id: number, name: string) {
	await db.update(subcategories).set({ name }).where(eq(subcategories.id, id));
}

// ---------- Sparziel-Aufteilung ----------

export async function getSavingsAllocations() {
	return db.query.savingsAllocations.findMany({ orderBy: asc(savingsAllocations.id) });
}

export async function updateSavingsAllocation(id: number, percent: number) {
	await db.update(savingsAllocations).set({ percent }).where(eq(savingsAllocations.id, id));
}

// ---------- Transaktionen ----------

async function findFixedTransaction(monthId: number, categoryId: number, subcategoryId: number | null) {
	return db.query.transactions.findFirst({
		where: and(
			eq(transactions.monthId, monthId),
			eq(transactions.categoryId, categoryId),
			subcategoryId === null ? isNull(transactions.subcategoryId) : eq(transactions.subcategoryId, subcategoryId)
		)
	});
}

export async function upsertFixedTransaction(
	monthId: number,
	categoryId: number,
	subcategoryId: number | null,
	betrag: number
) {
	const existing = await findFixedTransaction(monthId, categoryId, subcategoryId);
	if (existing) {
		await db.update(transactions).set({ betrag }).where(eq(transactions.id, existing.id));
	} else {
		await db.insert(transactions).values({ monthId, categoryId, subcategoryId, bezeichnung: '', betrag });
	}
}

export async function addTransaction(
	monthId: number,
	categoryId: number,
	bezeichnung: string,
	betrag: number,
	datum: string | null
) {
	await db.insert(transactions).values({ monthId, categoryId, subcategoryId: null, bezeichnung, betrag, datum });
}

export async function deleteTransaction(id: number) {
	await db.delete(transactions).where(eq(transactions.id, id));
}

// ---------- Dashboard-Daten für einen Monat ----------

async function getMonthTransactions(monthId: number) {
	return db.query.transactions.findMany({
		where: eq(transactions.monthId, monthId),
		with: { category: { with: { group: true } }, subcategory: true }
	});
}

type MonthTransactions = Awaited<ReturnType<typeof getMonthTransactions>>;

function sumByGroupTypes(txs: MonthTransactions, types: CategoryGroupType[]): number {
	return txs
		.filter((t) => types.includes(t.category.group.type))
		.reduce((sum, t) => sum + t.betrag, 0);
}

export async function getMonthDashboard(monthId: number) {
	const [tree, txs, allocations] = await Promise.all([
		getCategoryTree(),
		getMonthTransactions(monthId),
		getSavingsAllocations()
	]);

	const groupByType = (type: CategoryGroupType) => tree.find((g) => g.type === type);

	const incomeFixed = (groupByType('income_fixed')?.categories ?? []).map((cat) => ({
		category: cat,
		transaction: txs.find((t) => t.categoryId === cat.id) ?? null
	}));

	const incomeVariable = (groupByType('income_variable')?.categories ?? []).map((cat) => ({
		category: cat,
		transactions: txs.filter((t) => t.categoryId === cat.id)
	}));

	const expenseFixed = (groupByType('expense_fixed')?.categories ?? []).map((cat) => ({
		category: cat,
		subcategoryValues: cat.subcategories.map((sub) => ({
			subcategory: sub,
			transaction: txs.find((t) => t.subcategoryId === sub.id) ?? null
		})),
		direktTransaktion:
			cat.subcategories.length === 0
				? (txs.find((t) => t.categoryId === cat.id && t.subcategoryId === null) ?? null)
				: null
	}));

	const expenseVariable = (groupByType('expense_variable')?.categories ?? []).map((cat) => ({
		category: cat,
		transactions: txs.filter((t) => t.categoryId === cat.id)
	}));

	const gesamteinkommen = sumByGroupTypes(txs, ['income_fixed', 'income_variable']);
	const fixkostenSumme = sumByGroupTypes(txs, ['expense_fixed']);
	const variableAusgabenSumme = sumByGroupTypes(txs, ['expense_variable']);

	const summary = berechneMonat({
		gesamteinkommen,
		fixkostenSumme,
		variableAusgabenSumme,
		savingsAllocations: allocations
	});

	return { incomeFixed, incomeVariable, expenseFixed, expenseVariable, summary, fixkostenSumme, variableAusgabenSumme };
}

// ---------- Verlauf über alle Monate ----------

export async function getMonthsHistory() {
	const [allMonths, allocations] = await Promise.all([listMonths(), getSavingsAllocations()]);

	const results: {
		month: (typeof allMonths)[number];
		summary: MonthFinancialsResult;
		fixkostenSumme: number;
		variableAusgabenSumme: number;
	}[] = [];
	for (const month of allMonths) {
		const txs = await getMonthTransactions(month.id);
		const gesamteinkommen = sumByGroupTypes(txs, ['income_fixed', 'income_variable']);
		const fixkostenSumme = sumByGroupTypes(txs, ['expense_fixed']);
		const variableAusgabenSumme = sumByGroupTypes(txs, ['expense_variable']);
		const summary = berechneMonat({
			gesamteinkommen,
			fixkostenSumme,
			variableAusgabenSumme,
			savingsAllocations: allocations
		});
		results.push({ month, summary, fixkostenSumme, variableAusgabenSumme });
	}
	return results;
}

// ---------- Vermögen (Konten & Kontostände) ----------

export async function listAccounts() {
	return db.query.accounts.findMany({ orderBy: asc(accounts.name) });
}

export async function createAccount(name: string) {
	await db.insert(accounts).values({ name });
}

export async function upsertAccountBalance(accountId: number, monthId: number, betrag: number) {
	const existing = await db.query.accountBalances.findFirst({
		where: and(eq(accountBalances.accountId, accountId), eq(accountBalances.monthId, monthId))
	});
	if (existing) {
		await db.update(accountBalances).set({ betrag }).where(eq(accountBalances.id, existing.id));
	} else {
		await db.insert(accountBalances).values({ accountId, monthId, betrag });
	}
}

export async function getVermoegenHistory() {
	const [allMonths, allAccounts, allBalances] = await Promise.all([
		listMonths(),
		listAccounts(),
		db.select().from(accountBalances)
	]);
	const ascMonths = [...allMonths].sort((a, b) => a.jahr - b.jahr || a.monat - b.monat);

	const explicit = new Map<string, number>();
	for (const b of allBalances) explicit.set(`${b.accountId}-${b.monthId}`, b.betrag);

	const lastKnown = new Map<number, number>();
	const history: {
		month: (typeof ascMonths)[number];
		total: number;
		perAccount: Map<number, number>;
	}[] = [];

	for (const month of ascMonths) {
		const perAccount = new Map<number, number>();
		for (const account of allAccounts) {
			const wert = explicit.get(`${account.id}-${month.id}`);
			if (wert !== undefined) lastKnown.set(account.id, wert);
			perAccount.set(account.id, lastKnown.get(account.id) ?? 0);
		}
		const total = [...perAccount.values()].reduce((sum, v) => sum + v, 0);
		history.push({ month, total, perAccount });
	}

	return { history, accounts: allAccounts };
}

export async function getVermoegenForMonth(monthId: number) {
	const { history, accounts: allAccounts } = await getVermoegenHistory();
	const entry = history.find((h) => h.month.id === monthId);

	const items = allAccounts.map((account) => ({
		account,
		betrag: entry?.perAccount.get(account.id) ?? 0
	}));
	const total = entry?.total ?? 0;

	return { items, total };
}
