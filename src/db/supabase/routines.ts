import { supabase } from './client';

export type RoutineExercise = {
  id: string;
  routine_id: string;
  exercise_id: string;
  position: number;
  exercise_title: string;
};

export async function getOrCreateRoutine(sessionId: string): Promise<string> {
  const { data: existing, error: fetchError } = await supabase
    .from('routines')
    .select('id')
    .eq('session_id', sessionId)
    .maybeSingle();
  if (fetchError) throw fetchError;
  if (existing) return existing.id;

  const { data: created, error: insertError } = await supabase
    .from('routines')
    .insert({ session_id: sessionId })
    .select('id')
    .single();
  if (insertError) throw insertError;
  return created.id;
}

export async function listRoutineExercises(routineId: string): Promise<RoutineExercise[]> {
  const { data, error } = await supabase
    .from('routine_exercises')
    .select('id, routine_id, exercise_id, position, exercises(title)')
    .eq('routine_id', routineId)
    .order('position', { ascending: true });
  if (error) throw error;
  return data.map((row: any) => ({
    id: row.id,
    routine_id: row.routine_id,
    exercise_id: row.exercise_id,
    position: row.position,
    exercise_title: row.exercises?.title ?? '',
  }));
}

export async function addExerciseToRoutine(routineId: string, exerciseId: string, position: number) {
  const { error } = await supabase
    .from('routine_exercises')
    .insert({ routine_id: routineId, exercise_id: exerciseId, position });
  if (error) throw error;
}

export async function removeRoutineExercise(routineExerciseId: string) {
  const { error } = await supabase.from('routine_exercises').delete().eq('id', routineExerciseId);
  if (error) throw error;
}
