import { useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

import type { HomeAway, MatchInput, MatchStatus } from '../db/supabase/matches';
import type { TournamentClub } from '../db/supabase/tournamentClubs';
import { fonts, spacing, typography, useTheme } from '../theme';
import { deriveOutcome, OUTCOME_LABEL } from '../utils/tournamentResult';
import { AppButton } from './AppButton';
import { AppTextInput } from './AppTextInput';
import { DateField } from './DateField';
import { Dropdown } from './Dropdown';
import { TimeField } from './TimeField';

// tournament_id no se edita acá: lo fija la pantalla que llama a este
// formulario.
type MatchFormValue = Omit<MatchInput, 'tournament_id'>;

type Props = {
  clubs: TournamentClub[];
  initialValue?: MatchFormValue;
  onSubmit: (input: MatchFormValue) => Promise<void>;
  submitLabel: string;
};

function todayIso() {
  return new Date().toISOString().slice(0, 10);
}

const HOME_AWAY_OPTIONS: { value: HomeAway; label: string }[] = [
  { value: 'local', label: 'Local' },
  { value: 'visitante', label: 'Visitante' },
];

const STATUS_OPTIONS: { value: MatchStatus; label: string }[] = [
  { value: 'programado', label: 'Programado (todavía no se jugó)' },
  { value: 'jugado', label: 'Jugado (ya tiene resultado)' },
];

export function MatchForm({ clubs, initialValue, onSubmit, submitLabel }: Props) {
  const { colors } = useTheme();
  const [status, setStatus] = useState<MatchStatus>(initialValue?.status ?? 'programado');
  const [matchDate, setMatchDate] = useState<string | null>(initialValue?.match_date ?? todayIso());
  const [matchTime, setMatchTime] = useState<string | null>(initialValue?.match_time ?? null);
  const [opponent, setOpponent] = useState(initialValue?.opponent ?? '');
  const [clubId, setClubId] = useState<string | null>(initialValue?.club_id ?? null);
  const [courtName, setCourtName] = useState(initialValue?.court_name ?? '');
  const [homeAway, setHomeAway] = useState<HomeAway | null>(initialValue?.home_away ?? null);
  const [scoreOwn, setScoreOwn] = useState(
    initialValue?.score_own != null ? String(initialValue.score_own) : ''
  );
  const [scoreOpponent, setScoreOpponent] = useState(
    initialValue?.score_opponent != null ? String(initialValue.score_opponent) : ''
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isPlayed = status === 'jugado';
  const parsedOwn = isPlayed && scoreOwn.trim() ? parseInt(scoreOwn, 10) : null;
  const parsedOpponent = isPlayed && scoreOpponent.trim() ? parseInt(scoreOpponent, 10) : null;
  const outcome = deriveOutcome(parsedOwn, parsedOpponent);

  async function handleSubmit() {
    const trimmedOpponent = opponent.trim();
    if (!trimmedOpponent) {
      setError('El rival es obligatorio.');
      return;
    }
    if (!matchDate) {
      setError('La fecha es obligatoria.');
      return;
    }
    setError(null);
    setLoading(true);
    try {
      await onSubmit({
        status,
        match_date: matchDate,
        match_time: matchTime,
        opponent: trimmedOpponent,
        club_id: clubId,
        court_name: courtName.trim() || null,
        home_away: homeAway,
        score_own: parsedOwn,
        score_opponent: parsedOpponent,
        result: outcome ? OUTCOME_LABEL[outcome] : null,
      });
    } catch (e) {
      setError(e instanceof Error ? e.message : 'No pudimos guardar. Probá de nuevo.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <ScrollView
      style={styles.scroll}
      contentContainerStyle={styles.container}
      keyboardShouldPersistTaps="handled"
    >
      <Text style={[styles.label, { color: colors.textMuted }]}>Estado del partido</Text>
      <Dropdown
        value={status}
        options={STATUS_OPTIONS}
        onChange={(v) => setStatus(v as MatchStatus)}
        title="Estado del partido"
      />

      <View style={styles.row}>
        <View style={styles.rowField}>
          <Text style={[styles.label, { color: colors.textMuted }]}>Fecha</Text>
          <DateField value={matchDate} onChange={setMatchDate} placeholder="Seleccionar fecha" />
        </View>
        <View style={styles.rowField}>
          <Text style={[styles.label, { color: colors.textMuted }]}>Hora</Text>
          <TimeField value={matchTime} onChange={setMatchTime} placeholder="Opcional" />
        </View>
      </View>

      <Text style={[styles.label, { color: colors.textMuted }]}>Rival</Text>
      <AppTextInput value={opponent} onChangeText={setOpponent} placeholder="Nombre del rival" />

      <Text style={[styles.label, { color: colors.textMuted }]}>Local o visitante</Text>
      <Dropdown
        value={homeAway ?? ''}
        options={[{ value: '', label: 'Sin especificar' }, ...HOME_AWAY_OPTIONS]}
        onChange={(v) => setHomeAway((v || null) as HomeAway | null)}
        placeholder="Sin especificar"
        title="Local o visitante"
      />

      <Text style={[styles.label, { color: colors.textMuted }]}>Club sede</Text>
      {clubs.length === 0 ? (
        <Text style={[styles.hint, { color: colors.textMuted }]}>
          Este torneo todavía no tiene clubes cargados — agregalos desde su pantalla de detalle.
        </Text>
      ) : (
        <Dropdown
          value={clubId ?? ''}
          options={[{ value: '', label: 'Sin especificar' }, ...clubs.map((c) => ({ value: c.id, label: c.name }))]}
          onChange={(v) => setClubId(v || null)}
          placeholder="Sin especificar"
          title="Club sede"
        />
      )}

      <Text style={[styles.label, { color: colors.textMuted }]}>Cancha (opcional)</Text>
      <AppTextInput value={courtName} onChangeText={setCourtName} placeholder="Ej: Cancha 2" />

      {isPlayed ? (
        <>
          <Text style={[styles.label, { color: colors.textMuted }]}>Marcador</Text>
          <View style={styles.row}>
            <View style={styles.rowField}>
              <AppTextInput
                value={scoreOwn}
                onChangeText={setScoreOwn}
                placeholder="Nosotros"
                keyboardType="number-pad"
              />
            </View>
            <View style={styles.rowField}>
              <AppTextInput
                value={scoreOpponent}
                onChangeText={setScoreOpponent}
                placeholder="Rival"
                keyboardType="number-pad"
              />
            </View>
          </View>
          {outcome ? (
            <Text style={[styles.outcome, { color: colors.text }]}>Resultado: {OUTCOME_LABEL[outcome]}</Text>
          ) : null}
        </>
      ) : null}

      {error ? <Text style={[styles.error, { color: colors.danger }]}>{error}</Text> : null}

      <Text style={styles.spacer} />
      <AppButton
        label={submitLabel}
        onPress={handleSubmit}
        loading={loading}
        disabled={!opponent.trim() || !matchDate}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: { flex: 1 },
  container: { padding: spacing.lg },
  label: {
    fontSize: typography.caption,
    fontFamily: fonts.bold,
    marginTop: spacing.md,
    marginBottom: spacing.xs,
  },
  row: { flexDirection: 'row', gap: spacing.md },
  rowField: { flex: 1 },
  hint: { fontSize: typography.caption, fontFamily: fonts.regular },
  outcome: { fontSize: typography.body, fontFamily: fonts.bold, marginTop: spacing.sm },
  error: { fontSize: typography.caption, fontFamily: fonts.regular, marginTop: spacing.md },
  spacer: { height: spacing.md },
});
