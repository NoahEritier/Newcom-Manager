import { useState } from 'react';
import { ScrollView, StyleSheet, Text } from 'react-native';

import type { TournamentInput } from '../db/supabase/tournaments';
import { fonts, spacing, typography, useTheme } from '../theme';
import { AppButton } from './AppButton';
import { AppTextInput } from './AppTextInput';
import { DateField } from './DateField';

type Props = {
  initialValue?: TournamentInput;
  onSubmit: (input: TournamentInput) => Promise<void>;
  submitLabel: string;
};

function todayIso() {
  return new Date().toISOString().slice(0, 10);
}

export function TournamentForm({ initialValue, onSubmit, submitLabel }: Props) {
  const { colors } = useTheme();
  const [matchDate, setMatchDate] = useState<string | null>(initialValue?.match_date ?? todayIso());
  const [opponent, setOpponent] = useState(initialValue?.opponent ?? '');
  const [location, setLocation] = useState(initialValue?.location ?? '');
  const [result, setResult] = useState(initialValue?.result ?? '');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
        opponent: trimmedOpponent,
        location: location.trim() || null,
        result: result.trim() || null,
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
      <Text style={[styles.label, { color: colors.textMuted }]}>Fecha</Text>
      <DateField value={matchDate} onChange={setMatchDate} placeholder="Seleccionar fecha" />

      <Text style={[styles.label, { color: colors.textMuted }]}>Rival</Text>
      <AppTextInput value={opponent} onChangeText={setOpponent} placeholder="Nombre del rival" />

      <Text style={[styles.label, { color: colors.textMuted }]}>Lugar</Text>
      <AppTextInput value={location} onChangeText={setLocation} placeholder="Cancha / dirección" />

      <Text style={[styles.label, { color: colors.textMuted }]}>Resultado (opcional)</Text>
      <AppTextInput value={result} onChangeText={setResult} placeholder="Ej: 3-1" />

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
  error: { fontSize: typography.caption, fontFamily: fonts.regular, marginTop: spacing.md },
  spacer: { height: spacing.md },
});
