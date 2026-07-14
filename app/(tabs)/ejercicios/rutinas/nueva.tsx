import { router } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { AppButton } from '../../../../src/components/AppButton';
import { AppTextInput } from '../../../../src/components/AppTextInput';
import { createRoutine } from '../../../../src/db/supabase/routines';
import { useAuth } from '../../../../src/hooks/useAuth';
import { useTeam } from '../../../../src/hooks/useTeam';
import { fonts, spacing, typography, useTheme } from '../../../../src/theme';

export default function NuevaRutinaScreen() {
  const { colors } = useTheme();
  const { session } = useAuth();
  const { teamId } = useTeam();
  const [title, setTitle] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleCreate() {
    const trimmed = title.trim();
    if (!trimmed || !session) return;
    setError(null);
    setLoading(true);
    try {
      const routineId = await createRoutine(session.user.id, teamId, trimmed);
      router.replace({ pathname: '/ejercicios/rutinas/[routineId]', params: { routineId } });
    } catch (e) {
      setError(e instanceof Error ? e.message : 'No pudimos crear la rutina.');
      setLoading(false);
    }
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Text style={[styles.label, { color: colors.textMuted }]}>Nombre de la rutina</Text>
      <AppTextInput value={title} onChangeText={setTitle} placeholder="Ej: Rutina de técnica" />
      {error ? <Text style={[styles.error, { color: colors.danger }]}>{error}</Text> : null}
      <View style={styles.spacer} />
      <AppButton label="Crear y agregar ejercicios" onPress={handleCreate} loading={loading} disabled={!title.trim()} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: spacing.lg },
  label: { fontSize: typography.caption, fontFamily: fonts.bold, marginBottom: spacing.xs },
  error: { fontSize: typography.caption, fontFamily: fonts.regular, marginTop: spacing.md },
  spacer: { height: spacing.md },
});
