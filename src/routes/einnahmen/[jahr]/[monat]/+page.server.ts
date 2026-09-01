import { fail } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { parseBetrag, parseMonthParams, resolveMonthId } from '$lib/server/month-params';
import {
	addTransaction,
	deleteTransaction,
	getMonthDashboard,
	getOrCreateMonth,
	upsertFixedTransaction
} from '$lib/server/db/queries';

export const load: PageServerLoad = async ({ params }) => {
	const { jahr, monat } = parseMonthParams(params);
	const month = await getOrCreateMonth(jahr, monat);
	const dashboard = await getMonthDashboard(month.id);

	return { jahr, monat, dashboard };
};

export const actions: Actions = {
	setFixed: async ({ request, params }) => {
		const monthId = await resolveMonthId(params);
		const data = await request.formData();
		const categoryId = Number(data.get('categoryId'));
		const betrag = parseBetrag(data.get('betrag'));
		if (!Number.isInteger(categoryId)) return fail(400, { error: 'Ungültige Kategorie' });
		if (betrag === null) return fail(400, { error: 'Ungültiger Betrag' });
		await upsertFixedTransaction(monthId, categoryId, null, betrag);
	},

	addVariable: async ({ request, params }) => {
		const monthId = await resolveMonthId(params);
		const data = await request.formData();
		const categoryId = Number(data.get('categoryId'));
		const bezeichnung = String(data.get('bezeichnung') ?? '').trim();
		const betrag = parseBetrag(data.get('betrag'));
		if (!Number.isInteger(categoryId)) return fail(400, { error: 'Ungültige Kategorie' });
		if (betrag === null) return fail(400, { error: 'Ungültiger Betrag' });
		await addTransaction(monthId, categoryId, bezeichnung, betrag, null);
	},

	deleteTransaction: async ({ request }) => {
		const data = await request.formData();
		const id = Number(data.get('id'));
		if (!Number.isInteger(id)) return fail(400, { error: 'Ungültige ID' });
		await deleteTransaction(id);
	}
};
