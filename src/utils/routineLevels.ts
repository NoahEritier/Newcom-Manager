import type { RoutineLevel } from '../db/supabase/routines';

export const ROUTINE_LEVELS: { value: RoutineLevel; label: string }[] = [
  { value: 'principiante', label: 'Principiante' },
  { value: 'intermedio', label: 'Intermedio' },
  { value: 'avanzado', label: 'Avanzado' },
];

export function levelLabel(level: RoutineLevel | null): string {
  return ROUTINE_LEVELS.find((l) => l.value === level)?.label ?? 'Sin nivel';
}
