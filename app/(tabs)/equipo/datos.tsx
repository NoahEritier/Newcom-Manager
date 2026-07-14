import { router } from 'expo-router';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';

import { TeamForm } from '../../../src/components/TeamForm';
import { updateTeam, type TeamInput } from '../../../src/db/supabase/team';
import { useTeam } from '../../../src/hooks/useTeam';
import { fonts, spacing, typography, useTheme } from '../../../src/theme';

export default function DatosDelEquipoScreen() {
  const { colors } = useTheme();
  const { team, isLoading, refresh } = useTeam();

  if (isLoading || !team) {
    return (
      <View style={[styles.center, { backgroundColor: colors.background }]}>
        <ActivityIndicator color={colors.primary} />
      </View>
    );
  }

  async function handleSubmit(input: TeamInput) {
    await updateTeam(team!.id, input);
    await refresh();
    router.back();
  }

  return (
    <TeamForm
      initialValue={{
        name: team.name,
        gender: team.gender,
        category: team.category,
        default_location: team.default_location,
        training_days: team.training_days,
      }}
      onSubmit={handleSubmit}
    />
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  error: { fontSize: typography.body, fontFamily: fonts.regular, textAlign: 'center', padding: spacing.lg },
});
