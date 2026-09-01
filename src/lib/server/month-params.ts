import { error } from '@sveltejs/kit';
import { getMonthByYearMonth } from './db/queries';

export function parseMonthParams(params: { jahr: string; monat: string }) {
	const jahr = Number(params.jahr);
	const monat = Number(params.monat);
	if (!Number.isInteger(jahr) || jahr < 2000 || jahr > 2100) error(404, 'Ungültiges Jahr');
	if (!Number.isInteger(monat) || monat < 1 || monat > 12) error(404, 'Ungültiger Monat');
	return { jahr, monat };
}

export async function resolveMonthId(params: { jahr: string; monat: string }) {
	const { jahr, monat } = parseMonthParams(params);
	const month = await getMonthByYearMonth(jahr, monat);
	if (!month) error(404, 'Monat nicht gefunden');
	return month.id;
}

export function parseBetrag(value: FormDataEntryValue | null): number | null {
	if (value === null) return null;
	const n = Number(String(value).replace(',', '.'));
	if (!Number.isFinite(n)) return null;
	return n;
}
