import { error, fail, redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { parseBetrag } from '$lib/server/month-params';
import {
	addVacationExpense,
	deleteVacation,
	deleteVacationExpense,
	getVacation,
	renameVacation
} from '$lib/server/db/queries';

function parseId(params: { id: string }) {
	const id = Number(params.id);
	if (!Number.isInteger(id)) error(404, 'Ungültige ID');
	return id;
}

export const load: PageServerLoad = async ({ params }) => {
	const id = parseId(params);
	const vacation = await getVacation(id);
	if (!vacation) error(404, 'Urlaub nicht gefunden');
	const total = vacation.expenses.reduce((sum, e) => sum + e.betrag, 0);
	return { vacation, total };
};

export const actions: Actions = {
	rename: async ({ request, params }) => {
		const id = parseId(params);
		const data = await request.formData();
		const name = String(data.get('name') ?? '').trim();
		const datum = String(data.get('datum') ?? '').trim();
		if (!name) return fail(400, { error: 'Name fehlt' });
		await renameVacation(id, name, datum || null);
	},

	addExpense: async ({ request, params }) => {
		const id = parseId(params);
		const data = await request.formData();
		const bezeichnung = String(data.get('bezeichnung') ?? '').trim();
		const betrag = parseBetrag(data.get('betrag'));
		const datum = String(data.get('datum') ?? '').trim();
		if (betrag === null) return fail(400, { error: 'Ungültiger Betrag' });
		await addVacationExpense(id, bezeichnung, betrag, datum || null);
	},

	deleteExpense: async ({ request }) => {
		const data = await request.formData();
		const expenseId = Number(data.get('id'));
		if (!Number.isInteger(expenseId)) return fail(400, { error: 'Ungültige ID' });
		await deleteVacationExpense(expenseId);
	},

	deleteVacation: async ({ params }) => {
		const id = parseId(params);
		await deleteVacation(id);
		redirect(303, '/urlaub');
	}
};
