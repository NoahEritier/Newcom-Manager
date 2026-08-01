import { useState } from 'react';
import { ScrollView, StyleSheet, Text } from 'react-native';

import type { TournamentClubInput } from '../db/supabase/tournamentClubs';
import { fonts, spacing, typography, useTheme } from '../theme';
import { AppButton } from './AppButton';
import { AppTextInput } from './AppTextInput';

type Props = {
  initialValue?: TournamentClubInput;
  onSubmit: (input: TournamentClubInput) => Promise<void>;
  submitLabel: string;
};

export function ClubForm({ initialValue, onSubmit, submitLabel }: Props) {
  const { colors } = useTheme();
  const [name, setName] = useState(initialValue?.name ?? '');
  const [address, setAddress] = useState(initialValue?.address ?? '');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit() {
    const trimmedName = name.trim();
    if (!trimmedName) {
      setError('El nombre del club es obligatorio.');
      return;
    }
    setError(null);
    setLoading(true);
    try {
      await onSubmit({ name: trimmedName, address: address.trim() || null });
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
      <Text style={[styles.label, { color: colors.textMuted }]}>Nombre del club</Text>
      <AppTextInput value={name} onChangeText={setName} placeholder="Ej: Club Atlético Sur" />

      <Text style={[styles.label, { color: colors.textMuted }]}>Dirección (para abrir en Maps)</Text>
      <AppTextInput value={address} onChangeText={setAddress} placeholder="Dirección completa" />

      {error ? <Text style={[styles.error, { color: colors.danger }]}>{error}</Text> : null}

      <Text style={styles.spacer} />
      <AppButton label={submitLabel} onPress={handleSubmit} loading={loading} disabled={!name.trim()} />
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
