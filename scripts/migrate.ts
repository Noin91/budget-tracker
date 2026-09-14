import { migrate } from 'drizzle-orm/sqlite-proxy/migrator';
import { db, sqlite } from './db';

// drizzle-kit migrate/push nutzt intern better-sqlite3, dessen natives Addon
// in dieser Umgebung abstürzt (siehe Kommentar in src/lib/server/db/index.ts).
// Wir wenden Migrationen deshalb über den gleichen node:sqlite-Proxy an,
// den auch die App zur Laufzeit benutzt.
await migrate(
	db,
	async (queries) => {
		for (const query of queries) {
			if (query.trim()) sqlite.exec(query);
		}
	},
	{ migrationsFolder: './drizzle' }
);

console.log('Migrationen angewendet.');
