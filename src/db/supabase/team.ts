import { supabase } from './client';

export type Team = {
  id: string;
  name: string;
};

// Plan free = 1 equipo por coach: no hay pantalla de alta de equipos todavía,
// se crea uno default la primera vez que el coach entra a la sección Equipo.
export async function getOrCreateDefaultTeam(coachId: string): Promise<Team> {
  const { data: existing, error: fetchError } = await supabase
    .from('teams')
    .select('id, name')
    .eq('coach_id', coachId)
    .limit(1)
    .maybeSingle();
  if (fetchError) throw fetchError;
  if (existing) return existing;

  const { data: created, error: insertError } = await supabase
    .from('teams')
    .insert({ coach_id: coachId, name: 'Mi equipo' })
    .select('id, name')
    .single();
  if (insertError) throw insertError;
  return created;
}
