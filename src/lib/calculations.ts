export interface SavingsAllocationInput {
	id: number;
	name: string;
	percent: number;
}

export interface MonthFinancialsInput {
	gesamteinkommen: number;
	fixkostenSumme: number;
	variableAusgabenSumme: number;
	savingsAllocations: SavingsAllocationInput[];
}

export interface SavingsAllocationResult {
	id: number;
	name: string;
	percent: number;
	zielbetrag: number;
}

export interface MonthFinancialsResult {
	gesamteinkommen: number;
	sparzielProzent: number;
	sparziel: number;
	verfuegbaresBudget: number;
	restImMonat: number;
	istSparrate: number;
	bilanz: number;
	allocations: SavingsAllocationResult[];
}

export function berechneMonat(input: MonthFinancialsInput): MonthFinancialsResult {
	const { gesamteinkommen, fixkostenSumme, variableAusgabenSumme, savingsAllocations } = input;

	const sparzielProzent = savingsAllocations.reduce((sum, a) => sum + a.percent, 0) / 100;
	const sparziel = gesamteinkommen * sparzielProzent;
	const verfuegbaresBudget = gesamteinkommen - fixkostenSumme - sparziel;
	const restImMonat = verfuegbaresBudget - variableAusgabenSumme;
	const istSparrate =
		gesamteinkommen === 0
			? 0
			: (gesamteinkommen - fixkostenSumme - variableAusgabenSumme) / gesamteinkommen;

	// Bilanz: Einnahmen minus alle Ausgaben minus Sparziel ohne Reserve (Reserve zählt noch als übrig)
	const bilanzSparanteil =
		savingsAllocations.filter((a) => a.name !== 'Reserve').reduce((sum, a) => sum + a.percent, 0) / 100;
	const bilanz = gesamteinkommen - fixkostenSumme - variableAusgabenSumme - gesamteinkommen * bilanzSparanteil;

	const allocations: SavingsAllocationResult[] = savingsAllocations.map((a) => ({
		id: a.id,
		name: a.name,
		percent: a.percent,
		zielbetrag: gesamteinkommen * (a.percent / 100)
	}));

	return {
		gesamteinkommen,
		sparzielProzent,
		sparziel,
		verfuegbaresBudget,
		restImMonat,
		istSparrate,
		bilanz,
		allocations
	};
}

export const MONATSNAMEN = [
	'Januar',
	'Februar',
	'März',
	'April',
	'Mai',
	'Juni',
	'Juli',
	'August',
	'September',
	'Oktober',
	'November',
	'Dezember'
];

export function formatEuro(betrag: number): string {
	return new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' }).format(betrag);
}

export function formatProzent(anteil: number): string {
	return new Intl.NumberFormat('de-DE', { style: 'percent', maximumFractionDigits: 1 }).format(
		anteil
	);
}
