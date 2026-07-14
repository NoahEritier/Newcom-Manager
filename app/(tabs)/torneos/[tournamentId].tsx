import { Stack, router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Linking, StyleSheet, Text, View } from 'react-native';

import { AppButton } from '../../../src/components/AppButton';
import { TournamentForm } from '../../../src/components/TournamentForm';
import {
  deleteTournament,
  getTournament,
  updateTournament,
  type Tournament,
  type TournamentInput,
} from '../../../src/db/supabase/tournaments';
import { fonts, spacing, typography, useTheme } from '../../../src/theme';
import { openWhatsAppMessage } from '../../../src/utils/whatsapp';

function formatDate(iso: string) {
  const [y, m, d] = iso.split('-');
  return `${d}/${m}/${y}`;
}

export default function EditarTorneoScreen() {
  const { colors } = useTheme();
  const { tournamentId } = useLocalSearchParams<{ tournamentId: string }>();
  const [tournament, setTournament] = useState<Tournament | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    getTournament(tournamentId)
      .then(setTournament)
      .catch((e) => setError(e instanceof Error ? e.message : 'No pudimos cargar el torneo.'))
      .finally(() => setLoading(false));
  }, [tournamentId]);

  async function handleSubmit(input: TournamentInput) {
    await updateTournament(tournamentId, input);
    router.back();
  }

  function confirmDelete() {
    Alert.alert(
      'Eliminar torneo',
      `¿Seguro que querés eliminar el torneo vs ${tournament?.opponent}? Esta acción no se puede deshacer.`,
      [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Eliminar', style: 'destructive', onPress: handleDelete },
      ]
    );
  }

  async function handleDelete() {
    setDeleting(true);
    try {
      await deleteTournament(tournamentId);
      router.replace('/torneos');
    } catch (e) {
      setDeleting(false);
      Alert.alert('Error', e instanceof Error ? e.message : 'No pudimos eliminar el torneo.');
    }
  }

  function handleShare() {
    if (!tournament) return;
    const parts = [
      `Convocatoria: torneo vs ${tournament.opponent}`,
      `Fecha: ${formatDate(tournament.match_date)}${tournament.match_time ? ` ${tournament.match_time.slice(0, 5)}hs` : ''}`,
    ];
    if (tournament.location) parts.push(`Lugar: ${tournament.location}`);
    openWhatsAppMessage(parts.join('\n'));
  }

  function handleOpenMaps() {
    if (!tournament?.address) return;
    const url = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(tournament.address)}`;
    Linking.openURL(url);
  }

  if (loading) {
    return (
      <View style={[styles.center, { backgroundColor: colors.background }]}>
        <ActivityIndicator color={colors.primary} />
      </View>
    );
  }

  if (error || !tournament) {
    return (
      <View style={[styles.center, { backgroundColor: colors.background }]}>
        <Text style={[styles.error, { color: colors.danger }]}>
          {error ?? 'Torneo no encontrado.'}
        </Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Stack.Screen options={{ title: `vs ${tournament.opponent}` }} />
      <View style={styles.quickActions}>
        <AppButton label="Enviar convocatoria por WhatsApp" variant="secondary" onPress={handleShare} />
        {tournament.address ? (
          <AppButton label="Abrir ubicación en Maps" variant="secondary" onPress={handleOpenMaps} />
        ) : null}
      </View>
      <TournamentForm
        submitLabel="Guardar cambios"
        onSubmit={handleSubmit}
        initialValue={{
          match_date: tournament.match_date,
          match_time: tournament.match_time,
          opponent: tournament.opponent,
          location: tournament.location,
          address: tournament.address,
          home_away: tournament.home_away,
          score_own: tournament.score_own,
          score_opponent: tournament.score_opponent,
          result: tournament.result,
        }}
      />
      <View style={styles.actionsContainer}>
        <AppButton
          label="Eliminar torneo"
          variant="secondary"
          onPress={confirmDelete}
          loading={deleting}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  error: { fontSize: typography.body, fontFamily: fonts.regular, textAlign: 'center', padding: spacing.lg },
  quickActions: { padding: spacing.lg, paddingBottom: 0, gap: spacing.sm },
  actionsContainer: { padding: spacing.lg, paddingTop: 0 },
});
