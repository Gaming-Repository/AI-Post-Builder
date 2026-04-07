import { drizzle as drizzleSqlite } from 'drizzle-orm/better-sqlite3';
import Database from 'better-sqlite3';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import * as schema from './schema.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const dbPath = join(__dirname, '../../dev.db');

let _db: ReturnType<typeof drizzleSqlite<typeof schema>> | null = null;

export function getDb() {
  if (!_db) {
    const sqlite = new Database(dbPath);
    sqlite.pragma('journal_mode = WAL');
    sqlite.pragma('foreign_keys = ON');

    // Auto-create tables on first use
    sqlite.exec(`
      CREATE TABLE IF NOT EXISTS sessions (
        id TEXT PRIMARY KEY,
        user_id INTEGER NOT NULL DEFAULT 1,
        topic TEXT,
        tone TEXT,
        audience TEXT,
        keywords TEXT,
        model TEXT DEFAULT 'sonnet',
        video_analysis_data TEXT,
        created_at TEXT DEFAULT (datetime('now')),
        updated_at TEXT DEFAULT (datetime('now'))
      );

      CREATE TABLE IF NOT EXISTS posts (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL DEFAULT 1,
        session_id TEXT NOT NULL REFERENCES sessions(id),
        platform TEXT NOT NULL CHECK(platform IN ('twitter','linkedin','instagram','facebook')),
        content TEXT NOT NULL,
        topic TEXT,
        tone TEXT,
        audience TEXT,
        keywords TEXT,
        model TEXT DEFAULT 'sonnet',
        character_count INTEGER NOT NULL,
        image_url TEXT,
        metadata TEXT,
        created_at TEXT DEFAULT (datetime('now')),
        updated_at TEXT DEFAULT (datetime('now'))
      );
    `);

    _db = drizzleSqlite(sqlite, { schema });
  }
  return _db;
}
