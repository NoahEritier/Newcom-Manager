import { generateUuid } from '../../utils/uuid';
import { getDb } from './db';

export type LocalSession = {
  id: string;
  team_id: string;
  session_date: string;
  sync_status: 'synced' | 'pending_create';
  updated_at: number;
};

export type LocalRecord = {
  id: string;
  session_id: string;
  player_id: string;
  present: number;
  sync_status: 'synced' | 'pending_create' | 'pending_update';
  updated_at: number;
};

export type SessionSummary = LocalSession & {
  present_count: number;
  absent_count: number;
};

export async function getOrCreateSessionForDate(
  teamId: string,
  sessionDate: string
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
    sync_status: 'pending_create',
    updated_at: Date.now(),
  };
  await db.runAsync(
    'INSERT INTO attendance_sessions_local (id, team_id, session_date, sync_status, updated_at) VALUES (?, ?, ?, ?, ?)',
    session.id,
    session.team_id,
    session.session_date,
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

export async function getRecordsForSession(sessionId: string): Promise<LocalRecord[]> {
  const db = await getDb();
  return db.getAllAsync<LocalRecord>(
    'SELECT * FROM attendance_records_local WHERE session_id = ?',
    sessionId
  );
}

export async function setAttendance(
  sessionId: string,
  playerId: string,
  present: boolean
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
      'INSERT INTO attendance_records_local (id, session_id, player_id, present, sync_status, updated_at) VALUES (?, ?, ?, ?, ?, ?)',
      generateUuid(),
      sessionId,
      playerId,
      present ? 1 : 0,
      'pending_create',
      updatedAt
    );
    return;
  }

  const nextStatus = existing.sync_status === 'synced' ? 'pending_update' : existing.sync_status;
  await db.runAsync(
    'UPDATE attendance_records_local SET present = ?, sync_status = ?, updated_at = ? WHERE id = ?',
    present ? 1 : 0,
    nextStatus,
    updatedAt,
    existing.id
  );
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
