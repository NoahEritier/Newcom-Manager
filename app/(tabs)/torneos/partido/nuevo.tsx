import { router, useLocalSearchParams } from 'expo-router';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';

import { MatchForm } from '../../../../src/components/MatchForm';
import { createMatch, type MatchInput } from '../../../../src/db/supabase/matches';
import { useTeam } from '../../../../src/hooks/useTeam';
import { fonts, spacing, typography, useTheme } from '../../../../src/theme';

export default function NuevoPartidoScreen() {
  const { colors } = useTheme();
  const { teamId, isLoading } = useTeam();
  const { tournamentId } = useLocalSearchParams<{ tournamentId?: string }>();

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

  async function handleSubmit(input: Omit<MatchInput, 'tournament_id'>) {
    await createMatch(teamId as string, { ...input, tournament_id: tournamentId ?? null });
    if (tournamentId) {
      router.replace({ pathname: '/torneos/[tournamentId]', params: { tournamentId } });
    } else {
      router.back();
    }
  }

  return <MatchForm submitLabel="Guardar partido" onSubmit={handleSubmit} />;
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  error: { fontSize: typography.body, fontFamily: fonts.regular, textAlign: 'center', padding: spacing.lg },
});
