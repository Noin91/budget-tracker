import { relations } from 'drizzle-orm';
import { integer, real, sqliteTable, text, unique } from 'drizzle-orm/sqlite-core';

export const months = sqliteTable(
	'months',
	{
		id: integer('id').primaryKey({ autoIncrement: true }),
		jahr: integer('jahr').notNull(),
		monat: integer('monat').notNull() // 1-12
	},
	(table) => [unique('months_jahr_monat_unique').on(table.jahr, table.monat)]
);

export const categoryGroupTypes = [
	'income_fixed',
	'income_variable',
	'expense_fixed',
	'expense_variable'
] as const;
export type CategoryGroupType = (typeof categoryGroupTypes)[number];

export const categoryGroups = sqliteTable('category_groups', {
	id: integer('id').primaryKey({ autoIncrement: true }),
	type: text('type').$type<CategoryGroupType>().notNull().unique()
});

export const categories = sqliteTable(
	'categories',
	{
		id: integer('id').primaryKey({ autoIncrement: true }),
		groupId: integer('group_id')
			.notNull()
			.references(() => categoryGroups.id, { onDelete: 'cascade' }),
		name: text('name').notNull()
	},
	(table) => [unique('categories_group_name_unique').on(table.groupId, table.name)]
);

export const subcategories = sqliteTable(
	'subcategories',
	{
		id: integer('id').primaryKey({ autoIncrement: true }),
		categoryId: integer('category_id')
			.notNull()
			.references(() => categories.id, { onDelete: 'cascade' }),
		name: text('name').notNull()
	},
	(table) => [unique('subcategories_category_name_unique').on(table.categoryId, table.name)]
);

export const transactions = sqliteTable('transactions', {
	id: integer('id').primaryKey({ autoIncrement: true }),
	monthId: integer('month_id')
		.notNull()
		.references(() => months.id, { onDelete: 'cascade' }),
	categoryId: integer('category_id')
		.notNull()
		.references(() => categories.id, { onDelete: 'cascade' }),
	subcategoryId: integer('subcategory_id').references(() => subcategories.id, {
		onDelete: 'cascade'
	}),
	bezeichnung: text('bezeichnung').notNull().default(''),
	betrag: real('betrag').notNull(),
	datum: text('datum') // ISO date string, optional
});

export const vacations = sqliteTable('vacations', {
	id: integer('id').primaryKey({ autoIncrement: true }),
	name: text('name').notNull(),
	datum: text('datum') // ISO date string, optional
});

export const vacationExpenses = sqliteTable('vacation_expenses', {
	id: integer('id').primaryKey({ autoIncrement: true }),
	vacationId: integer('vacation_id')
		.notNull()
		.references(() => vacations.id, { onDelete: 'cascade' }),
	bezeichnung: text('bezeichnung').notNull().default(''),
	betrag: real('betrag').notNull(),
	datum: text('datum') // ISO date string, optional
});

export const savingsAllocations = sqliteTable(
	'savings_allocations',
	{
		id: integer('id').primaryKey({ autoIncrement: true }),
		name: text('name').notNull(),
		percent: real('percent').notNull()
	},
	(table) => [unique('savings_allocations_name_unique').on(table.name)]
);

export const accounts = sqliteTable(
	'accounts',
	{
		id: integer('id').primaryKey({ autoIncrement: true }),
		name: text('name').notNull()
	},
	(table) => [unique('accounts_name_unique').on(table.name)]
);

export const accountBalances = sqliteTable(
	'account_balances',
	{
		id: integer('id').primaryKey({ autoIncrement: true }),
		accountId: integer('account_id')
			.notNull()
			.references(() => accounts.id, { onDelete: 'cascade' }),
		monthId: integer('month_id')
			.notNull()
			.references(() => months.id, { onDelete: 'cascade' }),
		betrag: real('betrag').notNull()
	},
	(table) => [unique('account_balances_account_month_unique').on(table.accountId, table.monthId)]
);

export const accountsRelations = relations(accounts, ({ many }) => ({
	balances: many(accountBalances)
}));

export const accountBalancesRelations = relations(accountBalances, ({ one }) => ({
	account: one(accounts, { fields: [accountBalances.accountId], references: [accounts.id] }),
	month: one(months, { fields: [accountBalances.monthId], references: [months.id] })
}));

export const categoryGroupsRelations = relations(categoryGroups, ({ many }) => ({
	categories: many(categories)
}));

export const categoriesRelations = relations(categories, ({ one, many }) => ({
	group: one(categoryGroups, { fields: [categories.groupId], references: [categoryGroups.id] }),
	subcategories: many(subcategories),
	transactions: many(transactions)
}));

export const subcategoriesRelations = relations(subcategories, ({ one, many }) => ({
	category: one(categories, { fields: [subcategories.categoryId], references: [categories.id] }),
	transactions: many(transactions)
}));

export const monthsRelations = relations(months, ({ many }) => ({
	transactions: many(transactions),
	accountBalances: many(accountBalances)
}));

export const transactionsRelations = relations(transactions, ({ one }) => ({
	month: one(months, { fields: [transactions.monthId], references: [months.id] }),
	category: one(categories, { fields: [transactions.categoryId], references: [categories.id] }),
	subcategory: one(subcategories, {
		fields: [transactions.subcategoryId],
		references: [subcategories.id]
	})
}));

export const vacationsRelations = relations(vacations, ({ many }) => ({
	expenses: many(vacationExpenses)
}));

export const vacationExpensesRelations = relations(vacationExpenses, ({ one }) => ({
	vacation: one(vacations, { fields: [vacationExpenses.vacationId], references: [vacations.id] })
}));
