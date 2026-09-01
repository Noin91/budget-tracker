import { fail } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { parseBetrag, parseMonthParams, resolveMonthId } from '$lib/server/month-params';
import {
	createAccount,
	getOrCreateMonth,
	getVermoegenForMonth,
	getVermoegenHistory,
	upsertAccountBalance
} from '$lib/server/db/queries';

export const load: PageServerLoad = async ({ params }) => {
	const { jahr, monat } = parseMonthParams(params);
	const month = await getOrCreateMonth(jahr, monat);
	const [vermoegen, { history, accounts }] = await Promise.all([
		getVermoegenForMonth(month.id),
		getVermoegenHistory()
	]);

	return { jahr, monat, vermoegen, history, accounts };
};

export const actions: Actions = {
	setBalance: async ({ request, params }) => {
		const monthId = await resolveMonthId(params);
		const data = await request.formData();
		const accountId = Number(data.get('accountId'));
		const betrag = parseBetrag(data.get('betrag'));
		if (!Number.isInteger(accountId)) return fail(400, { error: 'Ungültiges Konto' });
		if (betrag === null) return fail(400, { error: 'Ungültiger Betrag' });
		await upsertAccountBalance(accountId, monthId, betrag);
	},

	createAccount: async ({ request }) => {
		const data = await request.formData();
		const name = String(data.get('name') ?? '').trim();
		if (!name) return fail(400, { error: 'Name fehlt' });
		await createAccount(name);
	}
};
