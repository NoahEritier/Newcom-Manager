import { router, useLocalSearchParams } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';

import { MatchForm } from '../../../../src/components/MatchForm';
import { createMatch, type MatchInput } from '../../../../src/db/supabase/matches';
import { listTournamentClubs, type TournamentClub } from '../../../../src/db/supabase/tournamentClubs';
import { useTeam } from '../../../../src/hooks/useTeam';
import { fonts, spacing, typography, useTheme } from '../../../../src/theme';

export default function NuevoPartidoScreen() {
  const { colors } = useTheme();
  const { teamId, isLoading } = useTeam();
  const { tournamentId } = useLocalSearchParams<{ tournamentId: string }>();
  const [clubs, setClubs] = useState<TournamentClub[]>([]);
  const [loadingClubs, setLoadingClubs] = useState(true);

  const load = useCallback(async () => {
    if (!tournamentId) return;
    setClubs(await listTournamentClubs(tournamentId));
    setLoadingClubs(false);
  }, [tournamentId]);

  useEffect(() => {
    load();
  }, [load]);

  if (isLoading || loadingClubs) {
    return (
      <View style={[styles.center, { backgroundColor: colors.background }]}>
        <ActivityIndicator color={colors.primary} />
      </View>
    );
  }

  if (!teamId || !tournamentId) {
    return (
      <View style={[styles.center, { backgroundColor: colors.background }]}>
        <Text style={[styles.error, { color: colors.danger }]}>No pudimos encontrar el torneo.</Text>
      </View>
    );
  }

  async function handleSubmit(input: Omit<MatchInput, 'tournament_id'>) {
    await createMatch(teamId as string, { ...input, tournament_id: tournamentId });
    router.replace({ pathname: '/torneos/[tournamentId]', params: { tournamentId } });
  }

  return <MatchForm clubs={clubs} submitLabel="Guardar partido" onSubmit={handleSubmit} />;
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  error: { fontSize: typography.body, fontFamily: fonts.regular, textAlign: 'center', padding: spacing.lg },
});
