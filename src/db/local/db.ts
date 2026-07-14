import * as SQLite from 'expo-sqlite';

let dbPromise: Promise<SQLite.SQLiteDatabase> | null = null;

// SQLite no soporta "ADD COLUMN IF NOT EXISTS": se intenta y se ignora el
// error si la columna ya existe (forma simple de migrar sin versionado propio).
async function tryAddColumn(db: SQLite.SQLiteDatabase, table: string, column: string, type: string) {
  try {
    await db.execAsync(`ALTER TABLE ${table} ADD COLUMN ${column} ${type}`);
  } catch {
    // ya existe, no hacer nada
  }
}

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

      await tryAddColumn(db, 'attendance_sessions_local', 'session_time', 'TEXT');
      await tryAddColumn(db, 'attendance_sessions_local', 'location', 'TEXT');
      await tryAddColumn(db, 'attendance_records_local', 'note', 'TEXT');
      await tryAddColumn(db, 'attendance_records_local', 'edited_at', 'INTEGER');

      return db;
    });
  }
  return dbPromise;
}
