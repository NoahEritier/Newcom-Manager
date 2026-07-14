import { supabase } from './client';

export type TeamGender = 'masculino' | 'femenino' | 'mixto';

export type Team = {
  id: string;
  name: string;
  gender: TeamGender | null;
  category: string | null;
  default_location: string | null;
  training_days: number[]; // 0=domingo .. 6=sábado
};

export type TeamInput = {
  name: string;
  gender: TeamGender | null;
  category: string | null;
  default_location: string | null;
  training_days: number[];
};

const TEAM_COLUMNS = 'id, name, gender, category, default_location, training_days';

// Plan free = 1 equipo por coach: no hay pantalla de alta de equipos todavía,
// se crea uno default la primera vez que el coach entra a la sección Equipo.
// Preparado para multi-equipo a futuro sin migrar el esquema.
export async function getOrCreateDefaultTeam(coachId: string): Promise<Team> {
  const { data: existing, error: fetchError } = await supabase
    .from('teams')
    .select(TEAM_COLUMNS)
    .eq('coach_id', coachId)
    .limit(1)
    .maybeSingle();
  if (fetchError) throw fetchError;
  if (existing) return existing;

  const { data: created, error: insertError } = await supabase
    .from('teams')
    .insert({ coach_id: coachId, name: 'Mi equipo' })
    .select(TEAM_COLUMNS)
    .single();
  if (insertError) throw insertError;
  return created;
}

export async function updateTeam(teamId: string, input: TeamInput): Promise<void> {
  const { error } = await supabase.from('teams').update(input).eq('id', teamId);
  if (error) throw error;
}
