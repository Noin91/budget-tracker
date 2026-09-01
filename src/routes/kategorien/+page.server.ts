import { fail } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import {
	createCategory,
	createSubcategory,
	getCategoryTree,
	renameCategory,
	renameSubcategory
} from '$lib/server/db/queries';

export const load: PageServerLoad = async () => {
	const tree = await getCategoryTree();
	return { tree };
};

export const actions: Actions = {
	createCategory: async ({ request }) => {
		const data = await request.formData();
		const groupId = Number(data.get('groupId'));
		const name = String(data.get('name') ?? '').trim();
		if (!Number.isInteger(groupId)) return fail(400, { error: 'Ungültige Gruppe' });
		if (!name) return fail(400, { error: 'Name fehlt' });
		await createCategory(groupId, name);
	},

	renameCategory: async ({ request }) => {
		const data = await request.formData();
		const id = Number(data.get('id'));
		const name = String(data.get('name') ?? '').trim();
		if (!Number.isInteger(id)) return fail(400, { error: 'Ungültige ID' });
		if (!name) return fail(400, { error: 'Name fehlt' });
		await renameCategory(id, name);
	},

	createSubcategory: async ({ request }) => {
		const data = await request.formData();
		const categoryId = Number(data.get('categoryId'));
		const name = String(data.get('name') ?? '').trim();
		if (!Number.isInteger(categoryId)) return fail(400, { error: 'Ungültige Kategorie' });
		if (!name) return fail(400, { error: 'Name fehlt' });
		await createSubcategory(categoryId, name);
	},

	renameSubcategory: async ({ request }) => {
		const data = await request.formData();
		const id = Number(data.get('id'));
		const name = String(data.get('name') ?? '').trim();
		if (!Number.isInteger(id)) return fail(400, { error: 'Ungültige ID' });
		if (!name) return fail(400, { error: 'Name fehlt' });
		await renameSubcategory(id, name);
	}
};
