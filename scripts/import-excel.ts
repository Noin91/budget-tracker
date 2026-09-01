import XLSX from 'xlsx';
import { db } from './db';
import { accountBalances, accounts, months, transactions } from '../src/lib/server/db/schema';

const EXCEL_PATH = 'data/Haushaltsbuch_2026.xlsx';
const JAHR = 2026;
const OVERVIEW_SHEET = 'Haushaltsbuch 25';
const MONATS_SHEETS = [
	'Januar',
	'Februar',
	'März',
	'April',
	'Mai',
	'Juni',
	'Juli',
	'August',
	'September'
];
// Spaltenindex (0-basiert) im Übersichtsblatt für Januar..September
const MONATS_SPALTEN = [2, 3, 4, 5, 6, 7, 8, 9, 10];

type Row = (string | number | null)[];

interface FixedMapping {
	row: number;
	category: string;
	subcategory: string;
	erwarteteBeschriftung: string;
}

// Zeilen aus dem Übersichtsblatt "Haushaltsbuch 25" -> Fixkosten-Subcategory
const FIXED_MAPPING: FixedMapping[] = [
	{ row: 16, category: 'Wohnen', subcategory: 'Miete', erwarteteBeschriftung: 'Miete' },
	{ row: 17, category: 'Wohnen', subcategory: 'Strom', erwarteteBeschriftung: 'Strom' },
	{ row: 18, category: 'Wohnen', subcategory: 'Internet', erwarteteBeschriftung: 'Internet' },
	{
		row: 19,
		category: 'Wohnen',
		subcategory: 'Hausratversicherung',
		erwarteteBeschriftung: 'Hausratversicherung'
	},
	{ row: 20, category: 'Wohnen', subcategory: 'GEZ', erwarteteBeschriftung: 'GEZ' },
	{
		row: 21,
		category: 'Wohnen',
		subcategory: 'Versicherungen',
		erwarteteBeschriftung: 'Versicherungen'
	},
	{ row: 25, category: 'Sport', subcategory: 'Badminton', erwarteteBeschriftung: 'Badminton' },
	{ row: 26, category: 'Sport', subcategory: 'Cleverfit', erwarteteBeschriftung: 'Cleverfit' },
	{
		row: 27,
		category: 'Sport',
		subcategory: 'Deutscher Alpenverein',
		erwarteteBeschriftung: 'Deutscher Alpen Verein'
	},
	{ row: 29, category: 'Auto', subcategory: 'Versicherung', erwarteteBeschriftung: 'Versicherung' },
	{ row: 30, category: 'Auto', subcategory: 'ADAC', erwarteteBeschriftung: 'ADAC' },
	{ row: 31, category: 'Auto', subcategory: 'Steuern', erwarteteBeschriftung: 'Steuern' },
	{
		row: 33,
		category: 'Sonstige Verträge',
		subcategory: 'Apple Musik',
		erwarteteBeschriftung: 'Apple Musik'
	},
	{ row: 34, category: 'Sonstige Verträge', subcategory: 'Amazon', erwarteteBeschriftung: 'Amazon' },
	{ row: 35, category: 'Sonstige Verträge', subcategory: 'Handy', erwarteteBeschriftung: 'Handy' },
	{ row: 36, category: 'Sonstige Verträge', subcategory: 'Netflix', erwarteteBeschriftung: 'Netflix' },
	{
		row: 37,
		category: 'Sonstige Verträge',
		subcategory: 'Claude AI',
		erwarteteBeschriftung: 'Claude AI'
	},
	{
		row: 38,
		category: 'Sonstige Verträge',
		subcategory: 'Ing Diba',
		erwarteteBeschriftung: 'Ing Diba'
	},
	{ row: 39, category: 'Sonstige Verträge', subcategory: 'Dazn', erwarteteBeschriftung: 'Dazn' }
];

interface IncomeMapping {
	row: number;
	category: string;
	group: 'income_fixed' | 'income_variable';
	bezeichnung: string;
	erwarteteBeschriftung: string;
}

const INCOME_MAPPING: IncomeMapping[] = [
	{ row: 4, category: 'Gehalt', group: 'income_fixed', bezeichnung: '', erwarteteBeschriftung: 'Gehalt' },
	{ row: 5, category: 'Aktien', group: 'income_fixed', bezeichnung: '', erwarteteBeschriftung: 'Aktien' },
	{
		row: 6,
		category: 'Variable Einnahmen',
		group: 'income_variable',
		bezeichnung: 'Variable Einnahmen',
		erwarteteBeschriftung: 'Variable Einnahmen'
	}
];

interface VermoegenMapping {
	row: number;
	name: string;
	erwarteteBeschriftung: string;
}

// Zeilen aus dem Übersichtsblatt "Haushaltsbuch 25" -> Konto (Vermögens-Block)
const VERMOEGEN_MAPPING: VermoegenMapping[] = [
	{ row: 56, name: 'Relai (Bitcoin)', erwarteteBeschriftung: 'Relai' },
	{ row: 57, name: 'Girokonto', erwarteteBeschriftung: 'Girokonto' },
	{ row: 58, name: 'Tagesgeld Scalable', erwarteteBeschriftung: 'Tagesgeld Scalable' },
	{ row: 59, name: 'Notfallgroschen', erwarteteBeschriftung: 'Notfallgroschen' },
	{ row: 60, name: 'Sparkonto', erwarteteBeschriftung: 'Sparkonto' },
	{ row: 61, name: 'Qonto', erwarteteBeschriftung: 'Qonto' },
	{ row: 62, name: 'Geschäftskonto', erwarteteBeschriftung: 'Geschäftskonto' },
	{ row: 63, name: 'Bargeld', erwarteteBeschriftung: 'Bargeld' },
	{ row: 64, name: 'Aktien', erwarteteBeschriftung: 'Aktien' }
];

function normalisieren(text: string): string {
	return text
		.toLowerCase()
		.replace(/[^a-zäöüß]/g, '')
		.trim();
}

function istGueltigerBetrag(value: unknown): value is number {
	return typeof value === 'number' && Number.isFinite(value) && value !== 0;
}

// Für Kontostände ist 0 ein gültiger Snapshot-Wert (anders als bei Transaktionen) – nur "leer" wird übersprungen
function istVorhandenerWert(value: unknown): value is number {
	return typeof value === 'number' && Number.isFinite(value);
}

async function main() {
	const zusammenfassung = {
		monateAngelegt: 0,
		fixeEinnahmen: 0,
		variableEinnahmen: 0,
		fixeAusgaben: 0,
		variableAusgaben: 0,
		kontenAngelegt: 0,
		kontostaende: 0,
		uebersprungenLeerOderNull: 0,
		fehler: [] as string[]
	};

	const workbook = XLSX.readFile(EXCEL_PATH);

	// --- Kategorien/Unterkategorien aus der DB laden ---
	const alleCategories = await db.query.categories.findMany({ with: { group: true, subcategories: true } });

	function findeCategory(groupType: string, name: string) {
		return alleCategories.find(
			(c) => c.group.type === groupType && normalisieren(c.name) === normalisieren(name)
		);
	}

	// --- Monate Januar-September 2026 anlegen ---
	const monthIds: Record<number, number> = {};
	for (let monat = 1; monat <= 9; monat++) {
		let month = await db.query.months.findFirst({
			where: (m, { and, eq }) => and(eq(m.jahr, JAHR), eq(m.monat, monat))
		});
		if (!month) {
			const [created] = await db.insert(months).values({ jahr: JAHR, monat }).returning();
			month = created;
			zusammenfassung.monateAngelegt++;
		}
		monthIds[monat] = month.id;
	}

	// --- Übersichtsblatt: Einnahmen & Fixkosten ---
	const overviewSheet = workbook.Sheets[OVERVIEW_SHEET];
	if (!overviewSheet) throw new Error(`Tabellenblatt "${OVERVIEW_SHEET}" nicht gefunden`);
	const overviewRows = XLSX.utils.sheet_to_json<Row>(overviewSheet, {
		header: 1,
		raw: true,
		defval: null
	});

	for (const mapping of INCOME_MAPPING) {
		const zeile = overviewRows[mapping.row];
		const beschriftung = String(zeile?.[1] ?? '').trim();
		if (!normalisieren(beschriftung).includes(normalisieren(mapping.erwarteteBeschriftung))) {
			zusammenfassung.fehler.push(
				`Übersicht Zeile ${mapping.row}: erwartete Beschriftung "${mapping.erwarteteBeschriftung}", gefunden "${beschriftung}" – übersprungen`
			);
			continue;
		}
		const category = findeCategory(mapping.group, mapping.category);
		if (!category) {
			zusammenfassung.fehler.push(`Kategorie "${mapping.category}" (${mapping.group}) nicht gefunden`);
			continue;
		}
		for (let i = 0; i < MONATS_SPALTEN.length; i++) {
			const monat = i + 1;
			const betrag = zeile[MONATS_SPALTEN[i]];
			if (!istGueltigerBetrag(betrag)) {
				zusammenfassung.uebersprungenLeerOderNull++;
				continue;
			}
			await db.insert(transactions).values({
				monthId: monthIds[monat],
				categoryId: category.id,
				subcategoryId: null,
				bezeichnung: mapping.bezeichnung,
				betrag,
				datum: null
			});
			if (mapping.group === 'income_fixed') zusammenfassung.fixeEinnahmen++;
			else zusammenfassung.variableEinnahmen++;
		}
	}

	for (const mapping of FIXED_MAPPING) {
		const zeile = overviewRows[mapping.row];
		const beschriftung = String(zeile?.[1] ?? '').trim();
		if (!normalisieren(beschriftung).includes(normalisieren(mapping.erwarteteBeschriftung))) {
			zusammenfassung.fehler.push(
				`Übersicht Zeile ${mapping.row}: erwartete Beschriftung "${mapping.erwarteteBeschriftung}", gefunden "${beschriftung}" – übersprungen`
			);
			continue;
		}
		const category = findeCategory('expense_fixed', mapping.category);
		const subcategory = category?.subcategories.find(
			(s) => normalisieren(s.name) === normalisieren(mapping.subcategory)
		);
		if (!category || !subcategory) {
			zusammenfassung.fehler.push(
				`Subcategory "${mapping.subcategory}" unter "${mapping.category}" nicht gefunden`
			);
			continue;
		}
		for (let i = 0; i < MONATS_SPALTEN.length; i++) {
			const monat = i + 1;
			const betrag = zeile[MONATS_SPALTEN[i]];
			if (!istGueltigerBetrag(betrag)) {
				zusammenfassung.uebersprungenLeerOderNull++;
				continue;
			}
			await db.insert(transactions).values({
				monthId: monthIds[monat],
				categoryId: category.id,
				subcategoryId: subcategory.id,
				bezeichnung: '',
				betrag,
				datum: null
			});
			zusammenfassung.fixeAusgaben++;
		}
	}

	for (const mapping of VERMOEGEN_MAPPING) {
		const zeile = overviewRows[mapping.row];
		const beschriftung = String(zeile?.[1] ?? '').trim();
		if (!normalisieren(beschriftung).includes(normalisieren(mapping.erwarteteBeschriftung))) {
			zusammenfassung.fehler.push(
				`Übersicht Zeile ${mapping.row}: erwartete Beschriftung "${mapping.erwarteteBeschriftung}", gefunden "${beschriftung}" – übersprungen`
			);
			continue;
		}
		let account = await db.query.accounts.findFirst({
			where: (a, { eq }) => eq(a.name, mapping.name)
		});
		if (!account) {
			const [created] = await db.insert(accounts).values({ name: mapping.name }).returning();
			account = created;
			zusammenfassung.kontenAngelegt++;
		}
		for (let i = 0; i < MONATS_SPALTEN.length; i++) {
			const monat = i + 1;
			const betrag = zeile[MONATS_SPALTEN[i]];
			if (!istVorhandenerWert(betrag)) {
				zusammenfassung.uebersprungenLeerOderNull++;
				continue;
			}
			await db.insert(accountBalances).values({
				accountId: account.id,
				monthId: monthIds[monat],
				betrag
			});
			zusammenfassung.kontostaende++;
		}
	}

	// --- Monatsblätter: variable Ausgaben ---
	for (let monatIndex = 0; monatIndex < MONATS_SHEETS.length; monatIndex++) {
		const monat = monatIndex + 1;
		const sheetName = MONATS_SHEETS[monatIndex];
		const sheet = workbook.Sheets[sheetName];
		if (!sheet) {
			zusammenfassung.fehler.push(`Tabellenblatt "${sheetName}" nicht gefunden`);
			continue;
		}
		const rows = XLSX.utils.sheet_to_json<Row>(sheet, { header: 1, raw: true, defval: null });
		const headerZeile = rows[0] ?? [];
		const nameHeaderZeile = rows[1] ?? [];

		const bloecke: { categoryName: string; nameCol: number; betragCol: number }[] = [];
		for (let col = 0; col < nameHeaderZeile.length; col++) {
			if (nameHeaderZeile[col] === 'Name') {
				const categoryName = String(headerZeile[col] ?? '').trim();
				bloecke.push({ categoryName, nameCol: col, betragCol: col + 1 });
			}
		}

		for (const block of bloecke) {
			const category = findeCategory('expense_variable', block.categoryName);
			if (!category) {
				zusammenfassung.fehler.push(
					`${sheetName}: Kategorie "${block.categoryName}" nicht in expense_variable gefunden`
				);
				continue;
			}
			for (let r = 2; r < rows.length; r++) {
				const zeile = rows[r];
				if (!zeile) continue;
				const betrag = zeile[block.betragCol];
				const name = zeile[block.nameCol];
				if (!istGueltigerBetrag(betrag)) {
					if (betrag !== null) zusammenfassung.uebersprungenLeerOderNull++;
					continue;
				}
				await db.insert(transactions).values({
					monthId: monthIds[monat],
					categoryId: category.id,
					subcategoryId: null,
					bezeichnung: name === null ? '' : String(name).trim(),
					betrag,
					datum: null
				});
				zusammenfassung.variableAusgaben++;
			}
		}
	}

	console.log('\n=== Import abgeschlossen ===');
	console.log(`Monate angelegt: ${zusammenfassung.monateAngelegt}`);
	console.log(`Fixe Einnahmen importiert: ${zusammenfassung.fixeEinnahmen}`);
	console.log(`Variable Einnahmen importiert: ${zusammenfassung.variableEinnahmen}`);
	console.log(`Fixe Ausgaben importiert: ${zusammenfassung.fixeAusgaben}`);
	console.log(`Variable Ausgaben importiert: ${zusammenfassung.variableAusgaben}`);
	console.log(`Konten angelegt: ${zusammenfassung.kontenAngelegt}`);
	console.log(`Kontostände importiert: ${zusammenfassung.kontostaende}`);
	console.log(`Übersprungen (leer/0): ${zusammenfassung.uebersprungenLeerOderNull}`);
	if (zusammenfassung.fehler.length > 0) {
		console.log(`\nFehler/Warnungen (${zusammenfassung.fehler.length}):`);
		for (const f of zusammenfassung.fehler) console.log(` - ${f}`);
	} else {
		console.log('\nKeine Fehler.');
	}
}

main().then(() => process.exit(0));
