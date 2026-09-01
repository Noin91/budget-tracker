import 'dotenv/config';
import { DatabaseSync } from 'node:sqlite';
import { drizzle } from 'drizzle-orm/sqlite-proxy';
import * as schema from '../src/lib/server/db/schema';

if (!process.env.DATABASE_URL) throw new Error('DATABASE_URL is not set');

const sqlite = new DatabaseSync(process.env.DATABASE_URL);
sqlite.exec('PRAGMA foreign_keys = ON');

async function proxy(sql: string, params: any[], method: 'run' | 'all' | 'values' | 'get') {
	const stmt = sqlite.prepare(sql);

	if (method === 'run') {
		stmt.run(...params);
		return { rows: [] };
	}

	if (method === 'get') {
		const row = stmt.get(...params) as Record<string, unknown> | undefined;
		return { rows: row ? Object.values(row) : (undefined as unknown as any[]) };
	}

	const rows = stmt.all(...params) as Record<string, unknown>[];
	return { rows: rows.map((row) => Object.values(row)) };
}

export const db = drizzle(proxy, { schema });
