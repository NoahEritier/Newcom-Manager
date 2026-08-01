import { supabase } from './client';

export type ExerciseCategory = 'entrada_en_calor' | 'tecnica' | 'tactica' | 'fisico' | 'otro';
export type DurationMode = 'duracion' | 'repeticiones';

export type Exercise = {
  id: string;
  coach_id: string;
  title: string;
  description: string | null;
  media_url: string | null;
  category: ExerciseCategory | null;
  duration_minutes: number | null;
  duration_mode: DurationMode | null;
  reps: number | null;
  sets: number | null;
  materials: string | null;
  muscle_groups: string[];
  created_at: string;
};

export type ExerciseInput = {
  title: string;
  description: string | null;
  media_url: string | null;
  category: ExerciseCategory | null;
  duration_minutes: number | null;
  duration_mode: DurationMode | null;
  reps: number | null;
  sets: number | null;
  materials: string | null;
  muscle_groups: string[];
};

// Hasta 3 variaciones opcionales de un mismo ejercicio.
export type ExerciseVariant = {
  id: string;
  exercise_id: string;
  position: number;
  description: string | null;
  materials: string | null;
  load_text: string | null;
  duration_mode: DurationMode | null;
  duration_minutes: number | null;
  reps: number | null;
  sets: number | null;
};

export type ExerciseVariantInput = {
  position: number;
  description: string | null;
  materials: string | null;
  load_text: string | null;
  duration_mode: DurationMode | null;
  duration_minutes: number | null;
  reps: number | null;
  sets: number | null;
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

export async function createExercise(coachId: string, input: ExerciseInput): Promise<string> {
  const { data, error } = await supabase
    .from('exercises')
    .insert({ coach_id: coachId, ...input })
    .select('id')
    .single();
  if (error) throw error;
  return data.id;
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

export async function listExerciseVariants(exerciseId: string): Promise<ExerciseVariant[]> {
  const { data, error } = await supabase
    .from('exercise_variants')
    .select('*')
    .eq('exercise_id', exerciseId)
    .order('position', { ascending: true });
  if (error) throw error;
  return data;
}

// Reemplaza todas las variaciones del ejercicio por la lista dada (delete +
// reinsert, igual patrón que setTournamentAttendees) — más simple que hacer
// diff campo por campo para una lista chica de a lo sumo 3 filas.
export async function replaceExerciseVariants(
  exerciseId: string,
  variants: ExerciseVariantInput[]
): Promise<void> {
  const { error: deleteError } = await supabase
    .from('exercise_variants')
    .delete()
    .eq('exercise_id', exerciseId);
  if (deleteError) throw deleteError;

  if (variants.length === 0) return;
  const { error: insertError } = await supabase
    .from('exercise_variants')
    .insert(variants.map((v) => ({ exercise_id: exerciseId, ...v })));
  if (insertError) throw insertError;
}
