// Fuente única de verdad para las 12 estadísticas de player_match_stats: el
// orden acá es el mismo orden en el que aparecen las filas en la planilla
// PDF (statSheetPdf.ts) y en el que el Edge Function de escaneo devuelve los
// valores reconocidos (scan-stat-sheet) — no reordenar sin actualizar los 3.

export type StatFieldKey =
  | 'serve_total'
  | 'serve_aces'
  | 'serve_errors'
  | 'reception_good'
  | 'reception_regular'
  | 'reception_bad'
  | 'attack_total'
  | 'attack_points'
  | 'attack_errors'
  | 'double_touch_faults'
  | 'invasion_faults'
  | 'flecha_faults';

export type StatFieldGroup = 'main' | 'fault';

export type StatField = {
  key: StatFieldKey;
  section: string;
  label: string;
  group: StatFieldGroup;
  maxCount: number; // casilleros 0..maxCount-1, más un último casillero "maxCount+"
};

export const STAT_FIELDS: StatField[] = [
  { key: 'serve_total', section: 'Saque', label: 'Total', group: 'main', maxCount: 20 },
  { key: 'serve_aces', section: 'Saque', label: 'Aces', group: 'main', maxCount: 20 },
  { key: 'serve_errors', section: 'Saque', label: 'Errores', group: 'main', maxCount: 20 },
  { key: 'reception_good', section: 'Recepción', label: 'Buena', group: 'main', maxCount: 20 },
  { key: 'reception_regular', section: 'Recepción', label: 'Regular', group: 'main', maxCount: 20 },
  { key: 'reception_bad', section: 'Recepción', label: 'Mala', group: 'main', maxCount: 20 },
  { key: 'attack_total', section: 'Ataque', label: 'Total', group: 'main', maxCount: 20 },
  { key: 'attack_points', section: 'Ataque', label: 'Puntos', group: 'main', maxCount: 20 },
  { key: 'attack_errors', section: 'Ataque', label: 'Errores', group: 'main', maxCount: 20 },
  {
    key: 'double_touch_faults',
    section: 'Faltas (invasión y flecha son faltas, no ataques)',
    label: 'Dobles toques',
    group: 'fault',
    maxCount: 9,
  },
  {
    key: 'invasion_faults',
    section: 'Faltas (invasión y flecha son faltas, no ataques)',
    label: 'Invasiones',
    group: 'fault',
    maxCount: 9,
  },
  {
    key: 'flecha_faults',
    section: 'Faltas (invasión y flecha son faltas, no ataques)',
    label: 'Flechas',
    group: 'fault',
    maxCount: 9,
  },
];
