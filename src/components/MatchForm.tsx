import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import type { HomeAway, MatchInput } from '../db/supabase/matches';
import { fonts, minTouchSize, radius, spacing, typography, useTheme } from '../theme';
import { deriveOutcome, OUTCOME_LABEL } from '../utils/tournamentResult';
import { AppButton } from './AppButton';
import { AppTextInput } from './AppTextInput';
import { DateField } from './DateField';
import { TimeField } from './TimeField';

// tournament_id no se edita acá: lo fija la pantalla que llama a este
// formulario (partido suelto = null, partido de un torneo = el id del torneo).
type MatchFormValue = Omit<MatchInput, 'tournament_id'>;

type Props = {
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

export function MatchForm({ initialValue, onSubmit, submitLabel }: Props) {
  const { colors } = useTheme();
  const [matchDate, setMatchDate] = useState<string | null>(initialValue?.match_date ?? todayIso());
  const [matchTime, setMatchTime] = useState<string | null>(initialValue?.match_time ?? null);
  const [opponent, setOpponent] = useState(initialValue?.opponent ?? '');
  const [location, setLocation] = useState(initialValue?.location ?? '');
  const [address, setAddress] = useState(initialValue?.address ?? '');
  const [homeAway, setHomeAway] = useState<HomeAway | null>(initialValue?.home_away ?? null);
  const [scoreOwn, setScoreOwn] = useState(
    initialValue?.score_own != null ? String(initialValue.score_own) : ''
  );
  const [scoreOpponent, setScoreOpponent] = useState(
    initialValue?.score_opponent != null ? String(initialValue.score_opponent) : ''
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const parsedOwn = scoreOwn.trim() ? parseInt(scoreOwn, 10) : null;
  const parsedOpponent = scoreOpponent.trim() ? parseInt(scoreOpponent, 10) : null;
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
        match_date: matchDate,
        match_time: matchTime,
        opponent: trimmedOpponent,
        location: location.trim() || null,
        address: address.trim() || null,
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
      <View style={styles.pillRow}>
        {HOME_AWAY_OPTIONS.map((option) => {
          const selected = option.value === homeAway;
          return (
            <Pressable
              key={option.value}
              onPress={() => setHomeAway(selected ? null : option.value)}
              style={[
                styles.pill,
                { borderColor: colors.border, backgroundColor: colors.surface },
                selected && { backgroundColor: colors.primary, borderColor: colors.primary },
              ]}
            >
              <Text style={[styles.pillLabel, { color: selected ? colors.primaryText : colors.text }]}>
                {option.label}
              </Text>
            </Pressable>
          );
        })}
      </View>

      <Text style={[styles.label, { color: colors.textMuted }]}>Lugar</Text>
      <AppTextInput value={location} onChangeText={setLocation} placeholder="Nombre de la cancha" />

      <Text style={[styles.label, { color: colors.textMuted }]}>Dirección (para abrir en Maps)</Text>
      <AppTextInput value={address} onChangeText={setAddress} placeholder="Dirección completa" />

      <Text style={[styles.label, { color: colors.textMuted }]}>Marcador (después del partido)</Text>
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
  pillRow: { flexDirection: 'row', gap: spacing.sm },
  pill: {
    minHeight: minTouchSize,
    paddingHorizontal: spacing.md,
    borderRadius: radius,
    borderWidth: 1,
    justifyContent: 'center',
  },
  pillLabel: { fontSize: typography.caption, fontFamily: fonts.bold },
  outcome: { fontSize: typography.body, fontFamily: fonts.bold, marginTop: spacing.sm },
  error: { fontSize: typography.caption, fontFamily: fonts.regular, marginTop: spacing.md },
  spacer: { height: spacing.md },
});
