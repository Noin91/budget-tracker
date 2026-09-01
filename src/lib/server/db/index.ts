import { DatabaseSync } from 'node:sqlite';
import { drizzle } from 'drizzle-orm/sqlite-proxy';
import * as schema from './schema';
import { env } from '$env/dynamic/private';

if (!env.DATABASE_URL) throw new Error('DATABASE_URL is not set');

const sqlite = new DatabaseSync(env.DATABASE_URL);
sqlite.exec('PRAGMA journal_mode = WAL');
sqlite.exec('PRAGMA foreign_keys = ON');

// Node's eingebautes node:sqlite (statt better-sqlite3) umgeht das native
// .node-Addon, an dem Vite 8s Rolldown-Bundler beim Bündeln abstürzt.
// Drizzle hat dafür keinen fertigen Treiber, daher binden wir es über
// sqlite-proxy an - node:sqlite liefert Zeilen als benannte Objekte,
// Drizzle erwartet positionale Wert-Arrays in Spaltenreihenfolge.
async function proxy(sql: string, params: any[], method: 'run' | 'all' | 'values' | 'get') {
	const stmt = sqlite.prepare(sql);

	if (method === 'run') {
		stmt.run(...params);
		return { rows: [] };
	}

	if (method === 'get') {
		const row = stmt.get(...params) as Record<string, unknown> | undefined;
		// Drizzle unterscheidet "keine Zeile" (rows muss falsy sein) von "eine
		// Zeile mit lauter NULL-Werten" - ein leeres Array wäre hier truthy und
		// würde find-or-create-Muster (findFirst -> undefined) kaputt machen.
		return { rows: row ? Object.values(row) : (undefined as unknown as any[]) };
	}

	const rows = stmt.all(...params) as Record<string, unknown>[];
	return { rows: rows.map((row) => Object.values(row)) };
}

export const db = drizzle(proxy, { schema });
