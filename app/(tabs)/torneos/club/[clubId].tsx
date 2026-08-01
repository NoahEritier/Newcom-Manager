import { router, useLocalSearchParams } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';

import { ClubForm } from '../../../../src/components/ClubForm';
import {
  getTournamentClub,
  updateTournamentClub,
  type TournamentClubInput,
} from '../../../../src/db/supabase/tournamentClubs';
import { fonts, spacing, typography, useTheme } from '../../../../src/theme';

export default function EditarClubScreen() {
  const { colors } = useTheme();
  const { clubId } = useLocalSearchParams<{ clubId: string }>();
  const [initialValue, setInitialValue] = useState<TournamentClubInput | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(() => {
    return getTournamentClub(clubId)
      .then((club) => setInitialValue({ name: club.name, address: club.address }))
      .catch((e) => setError(e instanceof Error ? e.message : 'No pudimos cargar el club.'))
      .finally(() => setLoading(false));
  }, [clubId]);

  useEffect(() => {
    load();
  }, [load]);

  async function handleSubmit(input: TournamentClubInput) {
    await updateTournamentClub(clubId, input);
    router.back();
  }

  if (loading) {
    return (
      <View style={[styles.center, { backgroundColor: colors.background }]}>
        <ActivityIndicator color={colors.primary} />
      </View>
    );
  }

  if (error || !initialValue) {
    return (
      <View style={[styles.center, { backgroundColor: colors.background }]}>
        <Text style={[styles.error, { color: colors.danger }]}>{error ?? 'Club no encontrado.'}</Text>
      </View>
    );
  }

  return <ClubForm submitLabel="Guardar cambios" onSubmit={handleSubmit} initialValue={initialValue} />;
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  error: { fontSize: typography.body, fontFamily: fonts.regular, textAlign: 'center', padding: spacing.lg },
});
