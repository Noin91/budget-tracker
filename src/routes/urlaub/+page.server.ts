import { fail, redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { createVacation, listVacations } from '$lib/server/db/queries';

export const load: PageServerLoad = async () => {
	const vacations = await listVacations();
	return { vacations };
};

export const actions: Actions = {
	createVacation: async ({ request }) => {
		const data = await request.formData();
		const name = String(data.get('name') ?? '').trim();
		const datum = String(data.get('datum') ?? '').trim();
		if (!name) return fail(400, { error: 'Name fehlt' });
		const created = await createVacation(name, datum || null);
		redirect(303, `/urlaub/${created.id}`);
	}
};
