import * as SQLite from 'expo-sqlite';

let dbPromise: Promise<SQLite.SQLiteDatabase> | null = null;

export function getDb(): Promise<SQLite.SQLiteDatabase> {
  if (!dbPromise) {
    dbPromise = SQLite.openDatabaseAsync('newcom-manager.db').then(async (db) => {
      await db.execAsync(`
        PRAGMA journal_mode = WAL;

        CREATE TABLE IF NOT EXISTS players_cache (
          id TEXT PRIMARY KEY,
          team_id TEXT NOT NULL,
          full_name TEXT NOT NULL,
          is_active INTEGER NOT NULL
        );

        CREATE TABLE IF NOT EXISTS attendance_sessions_local (
          id TEXT PRIMARY KEY,
          team_id TEXT NOT NULL,
          session_date TEXT NOT NULL,
          sync_status TEXT NOT NULL DEFAULT 'pending_create',
          updated_at INTEGER NOT NULL
        );

        CREATE TABLE IF NOT EXISTS attendance_records_local (
          id TEXT PRIMARY KEY,
          session_id TEXT NOT NULL,
          player_id TEXT NOT NULL,
          present INTEGER NOT NULL,
          sync_status TEXT NOT NULL DEFAULT 'pending_create',
          updated_at INTEGER NOT NULL,
          UNIQUE(session_id, player_id)
        );
      `);
      return db;
    });
  }
  return dbPromise;
}
