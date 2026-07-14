import { supabase } from './client';

export type HomeAway = 'local' | 'visitante';

export type Match = {
  id: string;
  team_id: string;
  tournament_id: string | null;
  match_date: string;
  match_time: string | null;
  opponent: string;
  location: string | null;
  address: string | null;
  home_away: HomeAway | null;
  score_own: number | null;
  score_opponent: number | null;
  result: string | null;
  created_at: string;
};

export type MatchInput = {
  tournament_id: string | null;
  match_date: string;
  match_time: string | null;
  opponent: string;
  location: string | null;
  address: string | null;
  home_away: HomeAway | null;
  score_own: number | null;
  score_opponent: number | null;
  result: string | null;
};

// Partidos sueltos: los que no pertenecen a ningún torneo (tournament_id = null).
export async function listStandaloneMatches(teamId: string): Promise<Match[]> {
  const { data, error } = await supabase
    .from('matches')
    .select('*')
    .eq('team_id', teamId)
    .is('tournament_id', null)
    .order('match_date', { ascending: false });
  if (error) throw error;
  return data;
}

export async function listMatchesForTournament(tournamentId: string): Promise<Match[]> {
  const { data, error } = await supabase
    .from('matches')
    .select('*')
    .eq('tournament_id', tournamentId)
    .order('match_date', { ascending: true });
  if (error) throw error;
  return data;
}

export async function listAllMatches(teamId: string): Promise<Match[]> {
  const { data, error } = await supabase
    .from('matches')
    .select('*')
    .eq('team_id', teamId)
    .order('match_date', { ascending: false });
  if (error) throw error;
  return data;
}

export async function getMatch(matchId: string): Promise<Match> {
  const { data, error } = await supabase.from('matches').select('*').eq('id', matchId).single();
  if (error) throw error;
  return data;
}

export async function createMatch(teamId: string, input: MatchInput): Promise<string> {
  const { data, error } = await supabase
    .from('matches')
    .insert({ team_id: teamId, ...input })
    .select('id')
    .single();
  if (error) throw error;
  return data.id;
}

export async function updateMatch(matchId: string, input: MatchInput): Promise<void> {
  const { error } = await supabase.from('matches').update(input).eq('id', matchId);
  if (error) throw error;
}

export async function deleteMatch(matchId: string): Promise<void> {
  const { error } = await supabase.from('matches').delete().eq('id', matchId);
  if (error) throw error;
}
