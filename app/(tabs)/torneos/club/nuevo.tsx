import { router, useLocalSearchParams } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';

import { ClubForm } from '../../../../src/components/ClubForm';
import { createTournamentClub, type TournamentClubInput } from '../../../../src/db/supabase/tournamentClubs';
import { fonts, spacing, typography, useTheme } from '../../../../src/theme';

export default function NuevoClubScreen() {
  const { colors } = useTheme();
  const { tournamentId } = useLocalSearchParams<{ tournamentId: string }>();

  if (!tournamentId) {
    return (
      <View style={[styles.center, { backgroundColor: colors.background }]}>
        <Text style={[styles.error, { color: colors.danger }]}>No pudimos encontrar el torneo.</Text>
      </View>
    );
  }

  async function handleSubmit(input: TournamentClubInput) {
    await createTournamentClub(tournamentId, input);
    router.back();
  }

  return <ClubForm submitLabel="Guardar club" onSubmit={handleSubmit} />;
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  error: { fontSize: typography.body, fontFamily: fonts.regular, textAlign: 'center', padding: spacing.lg },
});
