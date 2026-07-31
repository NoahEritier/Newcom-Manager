import { STAT_FIELDS, type StatFieldKey } from '../../utils/statFields';
import type { TournamentType } from '../../utils/tournamentTypes';
import { supabase } from './client';

export type StatSheetStatus = 'borrador' | 'escaneada' | 'revisada' | 'confirmada';

export const STAT_SHEET_STATUS_LABEL: Record<StatSheetStatus, string> = {
  borrador: 'Sin empezar',
  escaneada: 'Escaneada',
  revisada: 'En revisión',
  confirmada: 'Confirmada',
};

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

// ==========================================================================
// Pantalla "Estadísticas": lista de partidos con su estado de planilla, y
// resumen/ranking agregado del equipo a partir de las planillas confirmadas.
// ==========================================================================

export type MatchStatOverview = {
  match_id: string;
  match_date: string;
  match_time: string | null;
  opponent: string;
  tournament_id: string;
  tournament_title: string;
  tournament_type: TournamentType;
  sheet_status: StatSheetStatus | null; // null = todavía no se creó la planilla
  loaded_count: number;
};

export async function listMatchesWithStatOverview(teamId: string): Promise<MatchStatOverview[]> {
  const { data: matches, error } = await supabase
    .from('matches')
    .select('id, match_date, match_time, opponent, tournament_id, tournaments(title, type)')
    .eq('team_id', teamId)
    .order('match_date', { ascending: false });
  if (error) throw error;
  if (matches.length === 0) return [];

  const matchIds = matches.map((m) => m.id);
  const { data: sheets, error: sheetsError } = await supabase
    .from('match_stat_sheets')
    .select('id, match_id, status')
    .in('match_id', matchIds);
  if (sheetsError) throw sheetsError;

  const sheetIds = sheets.map((s) => s.id);
  const { data: statRows, error: statsError } =
    sheetIds.length === 0
      ? { data: [] as { sheet_id: string }[], error: null }
      : await supabase.from('player_match_stats').select('sheet_id').in('sheet_id', sheetIds);
  if (statsError) throw statsError;

  return matches.map((m) => {
    const sheet = sheets.find((s) => s.match_id === m.id);
    const loadedCount = sheet ? statRows.filter((r) => r.sheet_id === sheet.id).length : 0;
    const tournament = m.tournaments as unknown as { title: string; type: TournamentType } | null;
    return {
      match_id: m.id,
      match_date: m.match_date,
      match_time: m.match_time,
      opponent: m.opponent,
      tournament_id: m.tournament_id,
      tournament_title: tournament?.title ?? '',
      tournament_type: tournament?.type ?? 'encuentro',
      sheet_status: sheet?.status ?? null,
      loaded_count: loadedCount,
    };
  });
}

export type TeamStatsTotals = Record<StatFieldKey, number>;

export type PlayerStatsRanking = TeamStatsTotals & {
  player_id: string;
  full_name: string;
};

export type StatsSummary = {
  totals: TeamStatsTotals;
  byPlayer: PlayerStatsRanking[];
};

// Resumen agregado en base a planillas CONFIRMADAS únicamente (las
// borrador/escaneada/en revisión todavía pueden cambiar, no deberían pesar
// en el resumen del equipo). tournamentId filtra a un torneo puntual.
export async function getConfirmedStatsSummary(
  teamId: string,
  tournamentId?: string | null
): Promise<StatsSummary> {
  let matchesQuery = supabase.from('matches').select('id').eq('team_id', teamId);
  if (tournamentId) matchesQuery = matchesQuery.eq('tournament_id', tournamentId);
  const { data: matches, error: matchesError } = await matchesQuery;
  if (matchesError) throw matchesError;
  if (matches.length === 0) return { totals: { ...EMPTY_STATS_COUNTS }, byPlayer: [] };

  const { data: sheets, error: sheetsError } = await supabase
    .from('match_stat_sheets')
    .select('id')
    .in(
      'match_id',
      matches.map((m) => m.id)
    )
    .eq('status', 'confirmada');
  if (sheetsError) throw sheetsError;
  if (sheets.length === 0) return { totals: { ...EMPTY_STATS_COUNTS }, byPlayer: [] };

  const [{ data: rows, error: rowsError }, { data: players, error: playersError }] = await Promise.all([
    supabase
      .from('player_match_stats')
      .select('*')
      .in(
        'sheet_id',
        sheets.map((s) => s.id)
      ),
    supabase.from('players').select('id, full_name').eq('team_id', teamId),
  ]);
  if (rowsError) throw rowsError;
  if (playersError) throw playersError;

  const totals: TeamStatsTotals = { ...EMPTY_STATS_COUNTS };
  const byPlayerMap = new Map<string, PlayerStatsRanking>();

  for (const row of rows) {
    let entry = byPlayerMap.get(row.player_id);
    if (!entry) {
      const player = players.find((p) => p.id === row.player_id);
      entry = { player_id: row.player_id, full_name: player?.full_name ?? 'Jugador', ...EMPTY_STATS_COUNTS };
      byPlayerMap.set(row.player_id, entry);
    }
    for (const field of STAT_FIELDS) {
      totals[field.key] += row[field.key];
      entry[field.key] += row[field.key];
    }
  }

  return { totals, byPlayer: Array.from(byPlayerMap.values()) };
}
