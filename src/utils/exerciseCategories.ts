import type { ExerciseCategory } from '../db/supabase/exercises';

export const EXERCISE_CATEGORIES: { value: ExerciseCategory; label: string }[] = [
  { value: 'entrada_en_calor', label: 'Entrada en calor' },
  { value: 'tecnica', label: 'Técnica' },
  { value: 'tactica', label: 'Táctica' },
  { value: 'fisico', label: 'Físico' },
  { value: 'otro', label: 'Otro' },
];

export function categoryLabel(category: ExerciseCategory | null): string {
  return EXERCISE_CATEGORIES.find((c) => c.value === category)?.label ?? 'Sin categoría';
}
