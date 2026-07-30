import { STAT_FIELDS, type StatFieldKey } from '../../utils/statFields';
import { supabase } from './client';

export type ScannedStatRow = {
  key: StatFieldKey;
  recognizedValue: number | null;
  ambiguous: boolean;
};

export type ScanStatSheetResult = {
  rows: ScannedStatRow[];
};

// Manda la foto de la página de UN jugador al Edge Function scan-stat-sheet
// (que la analiza con AWS Textract) y devuelve, por cada una de las 12
// estadísticas, el valor reconocido o null si quedó ambiguo. Nunca se guarda
// directo: siempre pasa por la pantalla de revisión (Bloque 4).
export async function scanStatSheetImage(imageUrl: string): Promise<ScanStatSheetResult> {
  const { data, error } = await supabase.functions.invoke('scan-stat-sheet', {
    body: { imageUrl },
  });
  if (error) throw error;
  return data as ScanStatSheetResult;
}

export function emptyRecognizedByKey(): Record<StatFieldKey, ScannedStatRow> {
  const result = {} as Record<StatFieldKey, ScannedStatRow>;
  for (const field of STAT_FIELDS) {
    result[field.key] = { key: field.key, recognizedValue: null, ambiguous: true };
  }
  return result;
}
