export type MuscleGroupValue =
  | 'cuadriceps'
  | 'isquiotibiales'
  | 'gluteos'
  | 'pantorrillas'
  | 'core_abdominales'
  | 'espalda_baja'
  | 'espalda_alta'
  | 'pecho'
  | 'hombros'
  | 'biceps'
  | 'triceps'
  | 'antebrazos'
  | 'cardio_general'
  | 'tobillo'
  | 'rodilla'
  | 'cadera'
  | 'columna'
  | 'hombro'
  | 'codo'
  | 'muneca';

export const MUSCLE_GROUPS: { value: MuscleGroupValue; label: string; kind: 'muscle' | 'joint' }[] = [
  { value: 'cuadriceps', label: 'Cuádriceps', kind: 'muscle' },
  { value: 'isquiotibiales', label: 'Isquiotibiales', kind: 'muscle' },
  { value: 'gluteos', label: 'Glúteos', kind: 'muscle' },
  { value: 'pantorrillas', label: 'Pantorrillas', kind: 'muscle' },
  { value: 'core_abdominales', label: 'Core / abdominales', kind: 'muscle' },
  { value: 'espalda_baja', label: 'Espalda baja', kind: 'muscle' },
  { value: 'espalda_alta', label: 'Espalda alta', kind: 'muscle' },
  { value: 'pecho', label: 'Pecho', kind: 'muscle' },
  { value: 'hombros', label: 'Hombros', kind: 'muscle' },
  { value: 'biceps', label: 'Bíceps', kind: 'muscle' },
  { value: 'triceps', label: 'Tríceps', kind: 'muscle' },
  { value: 'antebrazos', label: 'Antebrazos', kind: 'muscle' },
  { value: 'cardio_general', label: 'Cardio / general', kind: 'muscle' },
  { value: 'tobillo', label: 'Tobillo', kind: 'joint' },
  { value: 'rodilla', label: 'Rodilla', kind: 'joint' },
  { value: 'cadera', label: 'Cadera', kind: 'joint' },
  { value: 'columna', label: 'Columna', kind: 'joint' },
  { value: 'hombro', label: 'Hombro', kind: 'joint' },
  { value: 'codo', label: 'Codo', kind: 'joint' },
  { value: 'muneca', label: 'Muñeca', kind: 'joint' },
];

export const MUSCLE_GROUPS_MUSCLES = MUSCLE_GROUPS.filter((m) => m.kind === 'muscle');
export const MUSCLE_GROUPS_JOINTS = MUSCLE_GROUPS.filter((m) => m.kind === 'joint');

export function muscleGroupLabel(value: string): string {
  return MUSCLE_GROUPS.find((m) => m.value === value)?.label ?? value;
}
