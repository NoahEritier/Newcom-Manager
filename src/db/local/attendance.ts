import { generateUuid } from '../../utils/uuid';
import { getDb } from './db';

export type LocalSession = {
  id: string;
  team_id: string;
  session_date: string;
  session_time: string | null;
  location: string | null;
  sync_status: 'synced' | 'pending_create' | 'pending_update';
  updated_at: number;
};

export type LocalRecord = {
  id: string;
  session_id: string;
  player_id: string;
  present: number;
  note: string | null;
  edited_at: number | null;
  sync_status: 'synced' | 'pending_create' | 'pending_update';
  updated_at: number;
};

export type SessionSummary = LocalSession & {
  present_count: number;
  absent_count: number;
};

export async function getOrCreateSessionForDate(
  teamId: string,
  sessionDate: string,
  defaultLocation: string | null = null
): Promise<LocalSession> {
  const db = await getDb();
  const existing = await db.getFirstAsync<LocalSession>(
    'SELECT * FROM attendance_sessions_local WHERE team_id = ? AND session_date = ?',
    teamId,
    sessionDate
  );
  if (existing) return existing;

  const session: LocalSession = {
    id: generateUuid(),
    team_id: teamId,
    session_date: sessionDate,
    session_time: null,
    location: defaultLocation,
    sync_status: 'pending_create',
    updated_at: Date.now(),
  };
  await db.runAsync(
    'INSERT INTO attendance_sessions_local (id, team_id, session_date, session_time, location, sync_status, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?)',
    session.id,
    session.team_id,
    session.session_date,
    session.session_time,
    session.location,
    session.sync_status,
    session.updated_at
  );
  return session;
}

export async function getSession(sessionId: string): Promise<LocalSession | null> {
  const db = await getDb();
  return db.getFirstAsync<LocalSession>(
    'SELECT * FROM attendance_sessions_local WHERE id = ?',
    sessionId
  );
}

export async function listRecentSessions(
  teamId: string,
  limit = 15
): Promise<SessionSummary[]> {
  const db = await getDb();
  return db.getAllAsync<SessionSummary>(
    `SELECT s.*,
       COALESCE(SUM(CASE WHEN r.present = 1 THEN 1 ELSE 0 END), 0) AS present_count,
       COALESCE(SUM(CASE WHEN r.present = 0 THEN 1 ELSE 0 END), 0) AS absent_count
     FROM attendance_sessions_local s
     LEFT JOIN attendance_records_local r ON r.session_id = s.id
     WHERE s.team_id = ?
     GROUP BY s.id
     ORDER BY s.session_date DESC
     LIMIT ?`,
    teamId,
    limit
  );
}

export async function listSessionDatesForTeam(teamId: string): Promise<string[]> {
  const db = await getDb();
  const rows = await db.getAllAsync<{ session_date: string }>(
    'SELECT DISTINCT session_date FROM attendance_sessions_local WHERE team_id = ?',
    teamId
  );
  return rows.map((r) => r.session_date);
}

export async function getRecordsForSession(sessionId: string): Promise<LocalRecord[]> {
  const db = await getDb();
  return db.getAllAsync<LocalRecord>(
    'SELECT * FROM attendance_records_local WHERE session_id = ?',
    sessionId
  );
}

export async function setSessionDetails(
  sessionId: string,
  details: { session_time: string | null; location: string | null }
): Promise<void> {
  const db = await getDb();
  const existing = await db.getFirstAsync<LocalSession>(
    'SELECT * FROM attendance_sessions_local WHERE id = ?',
    sessionId
  );
  if (!existing) return;
  const nextStatus = existing.sync_status === 'synced' ? 'pending_update' : existing.sync_status;
  await db.runAsync(
    'UPDATE attendance_sessions_local SET session_time = ?, location = ?, sync_status = ?, updated_at = ? WHERE id = ?',
    details.session_time,
    details.location,
    nextStatus,
    Date.now(),
    sessionId
  );
}

export async function deleteSessionLocal(sessionId: string): Promise<void> {
  const db = await getDb();
  await db.withTransactionAsync(async () => {
    await db.runAsync('DELETE FROM attendance_records_local WHERE session_id = ?', sessionId);
    await db.runAsync('DELETE FROM attendance_sessions_local WHERE id = ?', sessionId);
  });
}

export async function setAttendance(
  sessionId: string,
  playerId: string,
  present: boolean,
  note: string | null = null
): Promise<void> {
  const db = await getDb();
  const existing = await db.getFirstAsync<LocalRecord>(
    'SELECT * FROM attendance_records_local WHERE session_id = ? AND player_id = ?',
    sessionId,
    playerId
  );
  const updatedAt = Date.now();

  if (!existing) {
    await db.runAsync(
      'INSERT INTO attendance_records_local (id, session_id, player_id, present, note, edited_at, sync_status, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      generateUuid(),
      sessionId,
      playerId,
      present ? 1 : 0,
      note,
      null,
      'pending_create',
      updatedAt
    );
    return;
  }

  const wasSynced = existing.sync_status === 'synced';
  const nextStatus = wasSynced ? 'pending_update' : existing.sync_status;
  const nextNote = note !== null ? note : existing.note;
  await db.runAsync(
    'UPDATE attendance_records_local SET present = ?, note = ?, sync_status = ?, updated_at = ?, edited_at = ? WHERE id = ?',
    present ? 1 : 0,
    nextNote,
    nextStatus,
    updatedAt,
    wasSynced ? updatedAt : existing.edited_at,
    existing.id
  );
}

export async function markAllPresent(sessionId: string, playerIds: string[]): Promise<void> {
  for (const playerId of playerIds) {
    await setAttendance(sessionId, playerId, true);
  }
}

export async function countPendingRows(): Promise<number> {
  const db = await getDb();
  const sessions = await db.getFirstAsync<{ count: number }>(
    "SELECT COUNT(*) as count FROM attendance_sessions_local WHERE sync_status != 'synced'"
  );
  const records = await db.getFirstAsync<{ count: number }>(
    "SELECT COUNT(*) as count FROM attendance_records_local WHERE sync_status != 'synced'"
  );
  return (sessions?.count ?? 0) + (records?.count ?? 0);
}

export type PlayerAttendanceStat = {
  player_id: string;
  full_name: string;
  present_count: number;
  session_count: number;
};

// % de asistencia por jugador, en base a las sesiones cacheadas localmente
// (ventana de pull de 30 días — ver src/sync/attendanceSync.ts).
export async function getAttendanceStats(teamId: string): Promise<PlayerAttendanceStat[]> {
  const db = await getDb();
  return db.getAllAsync<PlayerAttendanceStat>(
    `SELECT
       p.id AS player_id,
       p.full_name AS full_name,
       COALESCE(SUM(CASE WHEN r.present = 1 THEN 1 ELSE 0 END), 0) AS present_count,
       COUNT(r.id) AS session_count
     FROM players_cache p
     LEFT JOIN attendance_records_local r ON r.player_id = p.id
     WHERE p.team_id = ? AND p.is_active = 1
     GROUP BY p.id, p.full_name
     ORDER BY p.full_name ASC`,
    teamId
  );
}
