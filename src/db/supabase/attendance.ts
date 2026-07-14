import { supabase } from './client';

export type RemoteSession = {
  id: string;
  team_id: string;
  session_date: string;
  session_time: string | null;
  location: string | null;
};

export type RemoteRecord = {
  id: string;
  session_id: string;
  player_id: string;
  present: boolean;
  note: string | null;
  edited_at: string | null;
};

const SESSION_COLUMNS = 'id, team_id, session_date, session_time, location';
const RECORD_COLUMNS = 'id, session_id, player_id, present, note, edited_at';

export async function listRemoteSessions(
  teamId: string,
  sinceDate: string
): Promise<RemoteSession[]> {
  const { data, error } = await supabase
    .from('attendance_sessions')
    .select(SESSION_COLUMNS)
    .eq('team_id', teamId)
    .gte('session_date', sinceDate)
    .order('session_date', { ascending: false });
  if (error) throw error;
  return data;
}

export async function listRemoteRecords(sessionIds: string[]): Promise<RemoteRecord[]> {
  if (sessionIds.length === 0) return [];
  const { data, error } = await supabase
    .from('attendance_records')
    .select(RECORD_COLUMNS)
    .in('session_id', sessionIds);
  if (error) throw error;
  return data;
}

export async function upsertRemoteSession(session: RemoteSession): Promise<void> {
  const { error } = await supabase.from('attendance_sessions').upsert(session, { onConflict: 'id' });
  if (error) throw error;
}

export async function upsertRemoteRecord(record: RemoteRecord): Promise<void> {
  const { error } = await supabase.from('attendance_records').upsert(record, { onConflict: 'id' });
  if (error) throw error;
}

export async function deleteRemoteSession(sessionId: string): Promise<void> {
  const { error } = await supabase.from('attendance_sessions').delete().eq('id', sessionId);
  if (error) throw error;
}
