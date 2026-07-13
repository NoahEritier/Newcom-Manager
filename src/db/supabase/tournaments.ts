import { supabase } from './client';

export type Tournament = {
  id: string;
  team_id: string;
  match_date: string;
  opponent: string;
  location: string | null;
  result: string | null;
  created_at: string;
};

export type TournamentInput = {
  match_date: string;
  opponent: string;
  location: string | null;
  result: string | null;
};

export async function listTournaments(teamId: string): Promise<Tournament[]> {
  const { data, error } = await supabase
    .from('tournaments')
    .select('*')
    .eq('team_id', teamId)
    .order('match_date', { ascending: false });
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

export async function createTournament(teamId: string, input: TournamentInput): Promise<void> {
  const { error } = await supabase.from('tournaments').insert({ team_id: teamId, ...input });
  if (error) throw error;
}

export async function updateTournament(tournamentId: string, input: TournamentInput): Promise<void> {
  const { error } = await supabase.from('tournaments').update(input).eq('id', tournamentId);
  if (error) throw error;
}

export async function deleteTournament(tournamentId: string): Promise<void> {
  const { error } = await supabase.from('tournaments').delete().eq('id', tournamentId);
  if (error) throw error;
}
