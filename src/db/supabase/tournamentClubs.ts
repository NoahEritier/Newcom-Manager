import { supabase } from './client';

export type TournamentClub = {
  id: string;
  tournament_id: string;
  name: string;
  address: string | null;
  created_at: string;
};

export type TournamentClubInput = {
  name: string;
  address: string | null;
};

// CRUD real (no delete-and-reinsert): matches.club_id referencia estas filas
// por id, así que hay que preservar los ids existentes al editar.
export async function listTournamentClubs(tournamentId: string): Promise<TournamentClub[]> {
  const { data, error } = await supabase
    .from('tournament_clubs')
    .select('*')
    .eq('tournament_id', tournamentId)
    .order('created_at', { ascending: true });
  if (error) throw error;
  return data;
}

export async function getTournamentClub(clubId: string): Promise<TournamentClub> {
  const { data, error } = await supabase.from('tournament_clubs').select('*').eq('id', clubId).single();
  if (error) throw error;
  return data;
}

export async function createTournamentClub(
  tournamentId: string,
  input: TournamentClubInput
): Promise<string> {
  const { data, error } = await supabase
    .from('tournament_clubs')
    .insert({ tournament_id: tournamentId, ...input })
    .select('id')
    .single();
  if (error) throw error;
  return data.id;
}

export async function updateTournamentClub(clubId: string, input: TournamentClubInput): Promise<void> {
  const { error } = await supabase.from('tournament_clubs').update(input).eq('id', clubId);
  if (error) throw error;
}

// Los partidos que apuntaban a este club quedan con club_id null (on delete
// set null) — no se borran, solo pierden la referencia a la sede.
export async function deleteTournamentClub(clubId: string): Promise<void> {
  const { error } = await supabase.from('tournament_clubs').delete().eq('id', clubId);
  if (error) throw error;
}
