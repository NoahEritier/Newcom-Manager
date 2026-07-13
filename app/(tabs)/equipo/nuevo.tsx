import { router } from 'expo-router';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';

import { PlayerForm } from '../../../src/components/PlayerForm';
import { createPlayer, type PlayerInput } from '../../../src/db/supabase/players';
import { useTeam } from '../../../src/hooks/useTeam';
import { fonts, spacing, typography, useTheme } from '../../../src/theme';

export default function NuevoJugadorScreen() {
  const { colors } = useTheme();
  const { teamId, isLoading } = useTeam();

  if (isLoading) {
    return (
      <View style={[styles.center, { backgroundColor: colors.background }]}>
        <ActivityIndicator color={colors.primary} />
      </View>
    );
  }

  if (!teamId) {
    return (
      <View style={[styles.center, { backgroundColor: colors.background }]}>
        <Text style={[styles.error, { color: colors.danger }]}>No pudimos encontrar tu equipo.</Text>
      </View>
    );
  }

  async function handleSubmit(input: PlayerInput) {
    await createPlayer(teamId as string, input);
    router.back();
  }

  return <PlayerForm submitLabel="Guardar jugador" onSubmit={handleSubmit} />;
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  error: { fontSize: typography.body, fontFamily: fonts.regular, textAlign: 'center', padding: spacing.lg },
});
