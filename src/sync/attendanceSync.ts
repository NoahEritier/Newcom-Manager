import {
  deleteRemoteSession,
  listRemoteRecords,
  listRemoteSessions,
  upsertRemoteRecord,
  upsertRemoteSession,
} from '../db/supabase/attendance';
import { listPlayers } from '../db/supabase/players';
import { getDb } from '../db/local/db';
import { type LocalRecord, type LocalSession } from '../db/local/attendance';
import { replacePlayersCache } from '../db/local/playersCache';

const PULL_WINDOW_DAYS = 30;

function daysAgoIso(days: number): string {
  const date = new Date();
  date.setDate(date.getDate() - days);
  return date.toISOString().slice(0, 10);
}

// Trae jugadores y sesiones/registros recientes a SQLite. Si una fila local
// tiene cambios sin subir (sync_status != 'synced'), no se pisa: gana lo local.
export async function pullAttendance(teamId: string): Promise<void> {
  const players = await listPlayers(teamId);
  await replacePlayersCache(
    teamId,
    players.map((p) => ({ id: p.id, full_name: p.full_name }))
  );

  const db = await getDb();
  const sinceDate = daysAgoIso(PULL_WINDOW_DAYS);
  const remoteSessions = await listRemoteSessions(teamId, sinceDate);

  for (const remoteSession of remoteSessions) {
    const local = await db.getFirstAsync<LocalSession>(
      'SELECT * FROM attendance_sessions_local WHERE team_id = ? AND session_date = ?',
      teamId,
      remoteSession.session_date
    );
    if (!local) {
      await db.runAsync(
        'INSERT INTO attendance_sessions_local (id, team_id, session_date, session_time, location, sync_status, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?)',
        remoteSession.id,
        teamId,
        remoteSession.session_date,
        remoteSession.session_time,
        remoteSession.location,
        'synced',
        Date.now()
      );
    } else if (local.sync_status === 'synced') {
      await db.runAsync(
        'UPDATE attendance_sessions_local SET id = ?, session_time = ?, location = ? WHERE id = ?',
        remoteSession.id,
        remoteSession.session_time,
        remoteSession.location,
        local.id
      );
    }
  }

  const sessionIds = remoteSessions.map((s) => s.id);
  const remoteRecords = await listRemoteRecords(sessionIds);

  for (const remoteRecord of remoteRecords) {
    const local = await db.getFirstAsync<LocalRecord>(
      'SELECT * FROM attendance_records_local WHERE session_id = ? AND player_id = ?',
      remoteRecord.session_id,
      remoteRecord.player_id
    );
    const editedAt = remoteRecord.edited_at ? new Date(remoteRecord.edited_at).getTime() : null;
    if (!local) {
      await db.runAsync(
        'INSERT INTO attendance_records_local (id, session_id, player_id, present, note, edited_at, sync_status, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
        remoteRecord.id,
        remoteRecord.session_id,
        remoteRecord.player_id,
        remoteRecord.present ? 1 : 0,
        remoteRecord.note,
        editedAt,
        'synced',
        Date.now()
      );
    } else if (local.sync_status === 'synced') {
      await db.runAsync(
        'UPDATE attendance_records_local SET present = ?, note = ?, edited_at = ?, id = ? WHERE id = ?',
        remoteRecord.present ? 1 : 0,
        remoteRecord.note,
        editedAt,
        remoteRecord.id,
        local.id
      );
    }
  }
}

export async function pushAttendance(teamId: string): Promise<{ pushed: number; failed: number }> {
  const db = await getDb();
  let pushed = 0;
  let failed = 0;

  const pendingSessions = await db.getAllAsync<LocalSession>(
    "SELECT * FROM attendance_sessions_local WHERE team_id = ? AND sync_status != 'synced'",
    teamId
  );
  for (const session of pendingSessions) {
    try {
      await upsertRemoteSession({
        id: session.id,
        team_id: session.team_id,
        session_date: session.session_date,
        session_time: session.session_time,
        location: session.location,
      });
      await db.runAsync(
        "UPDATE attendance_sessions_local SET sync_status = 'synced' WHERE id = ?",
        session.id
      );
      pushed++;
    } catch {
      failed++;
    }
  }

  const pendingRecords = await db.getAllAsync<LocalRecord>(
    `SELECT r.* FROM attendance_records_local r
     JOIN attendance_sessions_local s ON s.id = r.session_id
     WHERE s.team_id = ? AND r.sync_status != 'synced'`,
    teamId
  );
  for (const record of pendingRecords) {
    try {
      await upsertRemoteRecord({
        id: record.id,
        session_id: record.session_id,
        player_id: record.player_id,
        present: record.present === 1,
        note: record.note,
        edited_at: record.edited_at ? new Date(record.edited_at).toISOString() : null,
      });
      await db.runAsync(
        "UPDATE attendance_records_local SET sync_status = 'synced' WHERE id = ?",
        record.id
      );
      pushed++;
    } catch {
      failed++;
    }
  }

  return { pushed, failed };
}

export async function syncAttendance(teamId: string): Promise<{ pushed: number; failed: number }> {
  const result = await pushAttendance(teamId);
  await pullAttendance(teamId);
  return result;
}

// Borra la sesión remota si ya estaba sincronizada (si nunca se subió, no
// existe del otro lado y no hace falta). El delete local siempre se hace aparte.
export async function deleteSessionRemoteIfSynced(session: LocalSession): Promise<void> {
  if (session.sync_status === 'synced') {
    await deleteRemoteSession(session.id);
  }
}
