import { supabase } from './client';

export type RemoteSession = {
  id: string;
  team_id: string;
  session_date: string;
};

export type RemoteRecord = {
  id: string;
  session_id: string;
  player_id: string;
  present: boolean;
};

export async function listRemoteSessions(
  teamId: string,
  sinceDate: string
): Promise<RemoteSession[]> {
  const { data, error } = await supabase
    .from('attendance_sessions')
    .select('id, team_id, session_date')
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
    .select('id, session_id, player_id, present')
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
