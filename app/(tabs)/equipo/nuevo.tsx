import { router } from 'expo-router';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';

import { PlayerForm } from '../../../src/components/PlayerForm';
import { createPlayer, type PlayerInput } from '../../../src/db/supabase/players';
import { useTeam } from '../../../src/hooks/useTeam';
import { colors, spacing, typography } from '../../../src/theme';

export default function NuevoJugadorScreen() {
  const { teamId, isLoading } = useTeam();

  if (isLoading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={colors.primary} />
      </View>
    );
  }

  if (!teamId) {
    return (
      <View style={styles.center}>
        <Text style={styles.error}>No pudimos encontrar tu equipo.</Text>
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
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.background },
  error: { fontSize: typography.body, color: colors.danger, textAlign: 'center', padding: spacing.lg },
});
