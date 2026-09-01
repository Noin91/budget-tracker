import { fail } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { getSavingsAllocations, updateSavingsAllocation } from '$lib/server/db/queries';

export const load: PageServerLoad = async () => {
	const allocations = await getSavingsAllocations();
	return { allocations };
};

export const actions: Actions = {
	updateAllocation: async ({ request }) => {
		const data = await request.formData();
		const id = Number(data.get('id'));
		const percent = Number(String(data.get('percent') ?? '').replace(',', '.'));
		if (!Number.isInteger(id)) return fail(400, { error: 'Ungültige ID' });
		if (!Number.isFinite(percent) || percent < 0 || percent > 100) {
			return fail(400, { error: 'Prozentsatz muss zwischen 0 und 100 liegen' });
		}
		await updateSavingsAllocation(id, percent);
	}
};
