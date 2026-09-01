import { getMonthsHistory } from '$lib/server/db/queries';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async () => {
	const history = await getMonthsHistory();
	// chronologisch aufsteigend für den Chart
	history.sort((a, b) => a.month.jahr - b.month.jahr || a.month.monat - b.month.monat);
	return { history };
};
