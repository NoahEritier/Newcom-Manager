export type MatchOutcome = 'ganado' | 'perdido' | 'empatado';

export function deriveOutcome(scoreOwn: number | null, scoreOpponent: number | null): MatchOutcome | null {
  if (scoreOwn === null || scoreOpponent === null) return null;
  if (scoreOwn > scoreOpponent) return 'ganado';
  if (scoreOwn < scoreOpponent) return 'perdido';
  return 'empatado';
}

export const OUTCOME_LABEL: Record<MatchOutcome, string> = {
  ganado: 'Ganado',
  perdido: 'Perdido',
  empatado: 'Empatado',
};
