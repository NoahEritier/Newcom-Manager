import type { StatFieldKey } from '../../utils/statFields';
import { supabase } from './client';

export type StatSheetStatus = 'borrador' | 'escaneada' | 'revisada' | 'confirmada';

export type MatchStatSheet = {
  id: string;
  match_id: string;
  status: StatSheetStatus;
  confirmed_at: string | null;
  created_at: string;
};

export type PlayerMatchStats = {
  id: string;
  sheet_id: string;
  player_id: string;
  serve_total: number;
  serve_aces: number;
  serve_errors: number;
  reception_good: number;
  reception_regular: number;
  reception_bad: number;
  attack_total: number;
  attack_points: number;
  attack_errors: number;
  double_touch_faults: number;
  invasion_faults: number;
  flecha_faults: number;
  scanned_image_url: string | null;
  scanned_at: string | null;
  created_at: string;
  updated_at: string;
};

// Los 12 conteos, sin id/sheet_id/player_id/imagen/timestamps — lo que se
// edita en la pantalla de revisión (Bloque 4).
export type PlayerMatchStatsCounts = Record<StatFieldKey, number>;

export const EMPTY_STATS_COUNTS: PlayerMatchStatsCounts = {
  serve_total: 0,
  serve_aces: 0,
  serve_errors: 0,
  reception_good: 0,
  reception_regular: 0,
  reception_bad: 0,
  attack_total: 0,
  attack_points: 0,
  attack_errors: 0,
  double_touch_faults: 0,
  invasion_faults: 0,
  flecha_faults: 0,
};

export async function getStatSheetForMatch(matchId: string): Promise<MatchStatSheet | null> {
  const { data, error } = await supabase
    .from('match_stat_sheets')
    .select('*')
    .eq('match_id', matchId)
    .maybeSingle();
  if (error) throw error;
  return data;
}

// Una planilla por partido: si ya existe la devuelve, si no la crea en 'borrador'.
export async function getOrCreateStatSheet(matchId: string): Promise<MatchStatSheet> {
  const existing = await getStatSheetForMatch(matchId);
  if (existing) return existing;

  const { data, error } = await supabase
    .from('match_stat_sheets')
    .insert({ match_id: matchId })
    .select('*')
    .single();
  if (error) throw error;
  return data;
}

export async function updateStatSheetStatus(
  sheetId: string,
  status: StatSheetStatus,
  confirmedAt: string | null = null
): Promise<void> {
  const { error } = await supabase
    .from('match_stat_sheets')
    .update({ status, confirmed_at: confirmedAt })
    .eq('id', sheetId);
  if (error) throw error;
}

export async function listPlayerMatchStats(sheetId: string): Promise<PlayerMatchStats[]> {
  const { data, error } = await supabase
    .from('player_match_stats')
    .select('*')
    .eq('sheet_id', sheetId);
  if (error) throw error;
  return data;
}

// Alta o actualización del conteo de un jugador en una planilla, con la
// imagen escaneada que lo originó (o null si se cargó a mano).
export async function upsertPlayerMatchStats(
  sheetId: string,
  playerId: string,
  counts: PlayerMatchStatsCounts,
  scannedImageUrl: string | null
): Promise<void> {
  const { error } = await supabase.from('player_match_stats').upsert(
    {
      sheet_id: sheetId,
      player_id: playerId,
      ...counts,
      scanned_image_url: scannedImageUrl,
      scanned_at: scannedImageUrl ? new Date().toISOString() : null,
    },
    { onConflict: 'sheet_id,player_id' }
  );
  if (error) throw error;
}
