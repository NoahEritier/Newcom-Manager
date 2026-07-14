import { router } from 'expo-router';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';

import { TournamentEventForm } from '../../../src/components/TournamentEventForm';
import { createTournament, type TournamentInput } from '../../../src/db/supabase/tournaments';
import { useTeam } from '../../../src/hooks/useTeam';
import { fonts, spacing, typography, useTheme } from '../../../src/theme';

export default function NuevoTorneoScreen() {
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

  async function handleSubmit(input: TournamentInput) {
    const tournamentId = await createTournament(teamId as string, input);
    router.replace({ pathname: '/torneos/[tournamentId]', params: { tournamentId } });
  }

  return <TournamentEventForm submitLabel="Guardar torneo" onSubmit={handleSubmit} />;
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  error: { fontSize: typography.body, fontFamily: fonts.regular, textAlign: 'center', padding: spacing.lg },
});
