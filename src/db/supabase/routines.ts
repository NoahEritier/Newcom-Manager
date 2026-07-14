import { supabase } from './client';

export type Routine = {
  id: string;
  coach_id: string;
  team_id: string | null;
  title: string;
  is_favorite: boolean;
  created_at: string;
};

export type RoutineExercise = {
  id: string;
  routine_id: string;
  exercise_id: string;
  position: number;
  duration_minutes: number | null;
  notes: string | null;
  exercise_title: string;
};

export async function listRoutines(coachId: string): Promise<Routine[]> {
  const { data, error } = await supabase
    .from('routines')
    .select('*')
    .eq('coach_id', coachId)
    .order('is_favorite', { ascending: false })
    .order('title', { ascending: true });
  if (error) throw error;
  return data;
}

export async function getRoutine(routineId: string): Promise<Routine> {
  const { data, error } = await supabase.from('routines').select('*').eq('id', routineId).single();
  if (error) throw error;
  return data;
}

export async function createRoutine(
  coachId: string,
  teamId: string | null,
  title: string
): Promise<string> {
  const { data, error } = await supabase
    .from('routines')
    .insert({ coach_id: coachId, team_id: teamId, title })
    .select('id')
    .single();
  if (error) throw error;
  return data.id;
}

export async function updateRoutine(
  routineId: string,
  input: { title: string; is_favorite: boolean }
): Promise<void> {
  const { error } = await supabase.from('routines').update(input).eq('id', routineId);
  if (error) throw error;
}

export async function deleteRoutine(routineId: string): Promise<void> {
  const { error } = await supabase.from('routines').delete().eq('id', routineId);
  if (error) throw error;
}

export async function duplicateRoutine(routineId: string): Promise<string> {
  const original = await getRoutine(routineId);
  const exercises = await listRoutineExercises(routineId);
  const newId = await createRoutine(original.coach_id, original.team_id, `${original.title} (copia)`);
  for (const ex of exercises) {
    await addExerciseToRoutine(newId, ex.exercise_id, ex.position, ex.duration_minutes, ex.notes);
  }
  return newId;
}

export async function listRoutineExercises(routineId: string): Promise<RoutineExercise[]> {
  const { data, error } = await supabase
    .from('routine_exercises')
    .select('id, routine_id, exercise_id, position, duration_minutes, notes, exercises(title)')
    .eq('routine_id', routineId)
    .order('position', { ascending: true });
  if (error) throw error;
  return data.map((row: any) => ({
    id: row.id,
    routine_id: row.routine_id,
    exercise_id: row.exercise_id,
    position: row.position,
    duration_minutes: row.duration_minutes,
    notes: row.notes,
    exercise_title: row.exercises?.title ?? '',
  }));
}

export async function addExerciseToRoutine(
  routineId: string,
  exerciseId: string,
  position: number,
  durationMinutes: number | null = null,
  notes: string | null = null
): Promise<void> {
  const { error } = await supabase.from('routine_exercises').insert({
    routine_id: routineId,
    exercise_id: exerciseId,
    position,
    duration_minutes: durationMinutes,
    notes,
  });
  if (error) throw error;
}

export async function removeRoutineExercise(routineExerciseId: string): Promise<void> {
  const { error } = await supabase.from('routine_exercises').delete().eq('id', routineExerciseId);
  if (error) throw error;
}

// Reordenar: swap de posición entre dos routine_exercises (usado por las
// flechas subir/bajar — alternativa a drag-and-drop, más simple para el público objetivo).
export async function swapRoutineExercisePositions(
  a: { id: string; position: number },
  b: { id: string; position: number }
): Promise<void> {
  const { error: error1 } = await supabase
    .from('routine_exercises')
    .update({ position: b.position })
    .eq('id', a.id);
  if (error1) throw error1;
  const { error: error2 } = await supabase
    .from('routine_exercises')
    .update({ position: a.position })
    .eq('id', b.id);
  if (error2) throw error2;
}

// Vínculo rutina <-> sesión de asistencia (session_routines)
export async function listRoutinesForSession(sessionId: string): Promise<Routine[]> {
  const { data, error } = await supabase
    .from('session_routines')
    .select('routine_id, routines(*)')
    .eq('session_id', sessionId);
  if (error) throw error;
  return data.map((row: any) => row.routines);
}

export async function linkRoutineToSession(sessionId: string, routineId: string): Promise<void> {
  const { error } = await supabase
    .from('session_routines')
    .upsert({ session_id: sessionId, routine_id: routineId }, { onConflict: 'session_id,routine_id' });
  if (error) throw error;
}

export async function unlinkRoutineFromSession(sessionId: string, routineId: string): Promise<void> {
  const { error } = await supabase
    .from('session_routines')
    .delete()
    .eq('session_id', sessionId)
    .eq('routine_id', routineId);
  if (error) throw error;
}
