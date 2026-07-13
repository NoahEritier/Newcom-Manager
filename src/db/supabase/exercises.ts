import { supabase } from './client';

export type Exercise = {
  id: string;
  coach_id: string;
  title: string;
  description: string | null;
  media_url: string | null;
  created_at: string;
};

export type ExerciseInput = {
  title: string;
  description: string | null;
  media_url: string | null;
};

export async function listExercises(coachId: string): Promise<Exercise[]> {
  const { data, error } = await supabase
    .from('exercises')
    .select('*')
    .eq('coach_id', coachId)
    .order('title', { ascending: true });
  if (error) throw error;
  return data;
}

export async function getExercise(exerciseId: string): Promise<Exercise> {
  const { data, error } = await supabase.from('exercises').select('*').eq('id', exerciseId).single();
  if (error) throw error;
  return data;
}

export async function createExercise(coachId: string, input: ExerciseInput): Promise<void> {
  const { error } = await supabase.from('exercises').insert({ coach_id: coachId, ...input });
  if (error) throw error;
}

export async function updateExercise(exerciseId: string, input: ExerciseInput): Promise<void> {
  const { error } = await supabase.from('exercises').update(input).eq('id', exerciseId);
  if (error) throw error;
}

// Sin baja lógica: exercises no tiene is_active en el esquema (es una
// biblioteca reutilizable, no un registro histórico como players).
export async function deleteExercise(exerciseId: string): Promise<void> {
  const { error } = await supabase.from('exercises').delete().eq('id', exerciseId);
  if (error) throw error;
}
