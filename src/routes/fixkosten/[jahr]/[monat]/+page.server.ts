import { fail } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { parseBetrag, parseMonthParams, resolveMonthId } from '$lib/server/month-params';
import { getMonthDashboard, getOrCreateMonth, upsertFixedTransaction } from '$lib/server/db/queries';

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
		const subcategoryRaw = data.get('subcategoryId');
		const subcategoryId = subcategoryRaw ? Number(subcategoryRaw) : null;
		const betrag = parseBetrag(data.get('betrag'));
		if (!Number.isInteger(categoryId)) return fail(400, { error: 'Ungültige Kategorie' });
		if (betrag === null) return fail(400, { error: 'Ungültiger Betrag' });
		await upsertFixedTransaction(monthId, categoryId, subcategoryId, betrag);
	}
};
