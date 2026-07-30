import { generateUuid } from '../../utils/uuid';
import { supabase } from './client';

export type AttendanceSession = {
  id: string;
  team_id: string;
  session_date: string;
  session_time: string | null;
  location: string | null;
};

export type AttendanceRecord = {
  id: string;
  session_id: string;
  player_id: string;
  present: boolean;
  note: string | null;
  edited_at: string | null;
};

export type SessionSummary = AttendanceSession & {
  present_count: number;
  absent_count: number;
};

const SESSION_COLUMNS = 'id, team_id, session_date, session_time, location';
const RECORD_COLUMNS = 'id, session_id, player_id, present, note, edited_at';

export async function getOrCreateSessionForDate(
  teamId: string,
  sessionDate: string,
  defaultLocation: string | null = null
): Promise<AttendanceSession> {
  const { data: existing, error: findError } = await supabase
    .from('attendance_sessions')
    .select(SESSION_COLUMNS)
    .eq('team_id', teamId)
    .eq('session_date', sessionDate)
    .maybeSingle();
  if (findError) throw findError;
  if (existing) return existing;

  const { data, error } = await supabase
    .from('attendance_sessions')
    .insert({
      id: generateUuid(),
      team_id: teamId,
      session_date: sessionDate,
      session_time: null,
      location: defaultLocation,
    })
    .select(SESSION_COLUMNS)
    .single();
  if (error) throw error;
  return data;
}

export async function getSession(sessionId: string): Promise<AttendanceSession | null> {
  const { data, error } = await supabase
    .from('attendance_sessions')
    .select(SESSION_COLUMNS)
    .eq('id', sessionId)
    .maybeSingle();
  if (error) throw error;
  return data;
}

export async function listRecentSessions(teamId: string, limit = 15): Promise<SessionSummary[]> {
  const { data: sessions, error } = await supabase
    .from('attendance_sessions')
    .select(SESSION_COLUMNS)
    .eq('team_id', teamId)
    .order('session_date', { ascending: false })
    .limit(limit);
  if (error) throw error;
  if (sessions.length === 0) return [];

  const { data: records, error: recordsError } = await supabase
    .from('attendance_records')
    .select('session_id, present')
    .in(
      'session_id',
      sessions.map((s) => s.id)
    );
  if (recordsError) throw recordsError;

  return sessions.map((session) => {
    const sessionRecords = records.filter((r) => r.session_id === session.id);
    return {
      ...session,
      present_count: sessionRecords.filter((r) => r.present).length,
      absent_count: sessionRecords.filter((r) => !r.present).length,
    };
  });
}

export async function listSessionDatesForTeam(teamId: string): Promise<string[]> {
  const { data, error } = await supabase
    .from('attendance_sessions')
    .select('session_date')
    .eq('team_id', teamId);
  if (error) throw error;
  return Array.from(new Set(data.map((r) => r.session_date)));
}

export async function getRecordsForSession(sessionId: string): Promise<AttendanceRecord[]> {
  const { data, error } = await supabase
    .from('attendance_records')
    .select(RECORD_COLUMNS)
    .eq('session_id', sessionId);
  if (error) throw error;
  return data;
}

export async function setSessionDetails(
  sessionId: string,
  details: { session_time: string | null; location: string | null }
): Promise<void> {
  const { error } = await supabase.from('attendance_sessions').update(details).eq('id', sessionId);
  if (error) throw error;
}

export async function deleteSession(sessionId: string): Promise<void> {
  const { error } = await supabase.from('attendance_sessions').delete().eq('id', sessionId);
  if (error) throw error;
}

export async function setAttendance(
  sessionId: string,
  playerId: string,
  present: boolean,
  note: string | null = null
): Promise<void> {
  const { data: existing, error: findError } = await supabase
    .from('attendance_records')
    .select(RECORD_COLUMNS)
    .eq('session_id', sessionId)
    .eq('player_id', playerId)
    .maybeSingle();
  if (findError) throw findError;

  if (!existing) {
    const { error } = await supabase.from('attendance_records').insert({
      id: generateUuid(),
      session_id: sessionId,
      player_id: playerId,
      present,
      note,
      edited_at: null,
    });
    if (error) throw error;
    return;
  }

  const { error } = await supabase
    .from('attendance_records')
    .update({
      present,
      note: note !== null ? note : existing.note,
      edited_at: new Date().toISOString(),
    })
    .eq('id', existing.id);
  if (error) throw error;
}

export async function markAllPresent(sessionId: string, playerIds: string[]): Promise<void> {
  for (const playerId of playerIds) {
    await setAttendance(sessionId, playerId, true);
  }
}

export type PlayerAttendanceStat = {
  player_id: string;
  full_name: string;
  present_count: number;
  session_count: number;
};

const STATS_WINDOW_DAYS = 30;

// % de asistencia por jugador, en base a las sesiones de los últimos 30 días.
export async function getAttendanceStats(teamId: string): Promise<PlayerAttendanceStat[]> {
  const since = new Date();
  since.setDate(since.getDate() - STATS_WINDOW_DAYS);
  const sinceIso = since.toISOString().slice(0, 10);

  const [{ data: players, error: playersError }, { data: sessions, error: sessionsError }] = await Promise.all([
    supabase.from('players').select('id, full_name').eq('team_id', teamId).eq('is_active', true),
    supabase.from('attendance_sessions').select('id').eq('team_id', teamId).gte('session_date', sinceIso),
  ]);
  if (playersError) throw playersError;
  if (sessionsError) throw sessionsError;

  const sessionIds = sessions.map((s) => s.id);
  const records =
    sessionIds.length === 0
      ? []
      : await (async () => {
          const { data, error } = await supabase
            .from('attendance_records')
            .select('player_id, present')
            .in('session_id', sessionIds);
          if (error) throw error;
          return data;
        })();

  return players
    .map((player) => {
      const playerRecords = records.filter((r) => r.player_id === player.id);
      return {
        player_id: player.id,
        full_name: player.full_name,
        present_count: playerRecords.filter((r) => r.present).length,
        session_count: playerRecords.length,
      };
    })
    .sort((a, b) => a.full_name.localeCompare(b.full_name));
}
