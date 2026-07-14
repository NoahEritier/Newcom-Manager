import { supabase } from './client';

export type Tournament = {
  id: string;
  team_id: string;
  title: string;
  start_date: string;
  end_date: string | null;
  location: string | null;
  address: string | null;
  participating_teams: string | null;
  fee: number | null;
  is_paid: boolean;
  funding_source: string | null;
  created_at: string;
};

export type TournamentInput = {
  title: string;
  start_date: string;
  end_date: string | null;
  location: string | null;
  address: string | null;
  participating_teams: string | null;
  fee: number | null;
  is_paid: boolean;
  funding_source: string | null;
};

export async function listTournaments(teamId: string): Promise<Tournament[]> {
  const { data, error } = await supabase
    .from('tournaments')
    .select('*')
    .eq('team_id', teamId)
    .order('start_date', { ascending: false });
  if (error) throw error;
  return data;
}

export async function getTournament(tournamentId: string): Promise<Tournament> {
  const { data, error } = await supabase
    .from('tournaments')
    .select('*')
    .eq('id', tournamentId)
    .single();
  if (error) throw error;
  return data;
}

export async function createTournament(teamId: string, input: TournamentInput): Promise<string> {
  const { data, error } = await supabase
    .from('tournaments')
    .insert({ team_id: teamId, ...input })
    .select('id')
    .single();
  if (error) throw error;
  return data.id;
}

export async function updateTournament(tournamentId: string, input: TournamentInput): Promise<void> {
  const { error } = await supabase.from('tournaments').update(input).eq('id', tournamentId);
  if (error) throw error;
}

// Borra el torneo y en cascada sus partidos y asistentes (FK on delete cascade).
export async function deleteTournament(tournamentId: string): Promise<void> {
  const { error } = await supabase.from('tournaments').delete().eq('id', tournamentId);
  if (error) throw error;
}

export async function listTournamentAttendeeIds(tournamentId: string): Promise<string[]> {
  const { data, error } = await supabase
    .from('tournament_attendees')
    .select('player_id')
    .eq('tournament_id', tournamentId);
  if (error) throw error;
  return data.map((row) => row.player_id);
}

export async function setTournamentAttendees(tournamentId: string, playerIds: string[]): Promise<void> {
  const { error: deleteError } = await supabase
    .from('tournament_attendees')
    .delete()
    .eq('tournament_id', tournamentId);
  if (deleteError) throw deleteError;

  if (playerIds.length === 0) return;
  const { error: insertError } = await supabase
    .from('tournament_attendees')
    .insert(playerIds.map((playerId) => ({ tournament_id: tournamentId, player_id: playerId })));
  if (insertError) throw insertError;
}
