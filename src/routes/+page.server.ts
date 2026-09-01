import { redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async () => {
	const heute = new Date();
	const jahr = heute.getFullYear();
	const monat = heute.getMonth() + 1;
	redirect(307, `/monat/${jahr}/${monat}`);
};
