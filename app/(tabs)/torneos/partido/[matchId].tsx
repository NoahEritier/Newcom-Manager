import { Stack, router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Linking, StyleSheet, Text, View } from 'react-native';

import { AppButton } from '../../../../src/components/AppButton';
import { MatchForm } from '../../../../src/components/MatchForm';
import {
  deleteMatch,
  getMatch,
  updateMatch,
  type Match,
  type MatchInput,
} from '../../../../src/db/supabase/matches';
import { fonts, spacing, typography, useTheme } from '../../../../src/theme';
import { openWhatsAppMessage } from '../../../../src/utils/whatsapp';

function formatDate(iso: string) {
  const [y, m, d] = iso.split('-');
  return `${d}/${m}/${y}`;
}

export default function EditarPartidoScreen() {
  const { colors } = useTheme();
  const { matchId } = useLocalSearchParams<{ matchId: string }>();
  const [match, setMatch] = useState<Match | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    getMatch(matchId)
      .then(setMatch)
      .catch((e) => setError(e instanceof Error ? e.message : 'No pudimos cargar el partido.'))
      .finally(() => setLoading(false));
  }, [matchId]);

  async function handleSubmit(input: Omit<MatchInput, 'tournament_id'>) {
    if (!match) return;
    await updateMatch(matchId, { ...input, tournament_id: match.tournament_id });
    router.back();
  }

  function confirmDelete() {
    Alert.alert(
      'Eliminar partido',
      `¿Seguro que querés eliminar el partido vs ${match?.opponent}? Esta acción no se puede deshacer.`,
      [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Eliminar', style: 'destructive', onPress: handleDelete },
      ]
    );
  }

  async function handleDelete() {
    setDeleting(true);
    try {
      await deleteMatch(matchId);
      router.back();
    } catch (e) {
      setDeleting(false);
      Alert.alert('Error', e instanceof Error ? e.message : 'No pudimos eliminar el partido.');
    }
  }

  function handleShare() {
    if (!match) return;
    const parts = [
      `Convocatoria: partido vs ${match.opponent}`,
      `Fecha: ${formatDate(match.match_date)}${match.match_time ? ` ${match.match_time.slice(0, 5)}hs` : ''}`,
    ];
    if (match.location) parts.push(`Lugar: ${match.location}`);
    openWhatsAppMessage(parts.join('\n'));
  }

  function handleOpenMaps() {
    if (!match?.address) return;
    const url = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(match.address)}`;
    Linking.openURL(url);
  }

  if (loading) {
    return (
      <View style={[styles.center, { backgroundColor: colors.background }]}>
        <ActivityIndicator color={colors.primary} />
      </View>
    );
  }

  if (error || !match) {
    return (
      <View style={[styles.center, { backgroundColor: colors.background }]}>
        <Text style={[styles.error, { color: colors.danger }]}>{error ?? 'Partido no encontrado.'}</Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Stack.Screen options={{ title: `vs ${match.opponent}` }} />
      <View style={styles.quickActions}>
        {!match.tournament_id ? (
          <Text style={[styles.standaloneLabel, { color: colors.textMuted }]}>Partido suelto</Text>
        ) : null}
        <AppButton label="Enviar convocatoria por WhatsApp" variant="secondary" onPress={handleShare} />
        {match.address ? (
          <AppButton label="Abrir ubicación en Maps" variant="secondary" onPress={handleOpenMaps} />
        ) : null}
      </View>
      <MatchForm
        submitLabel="Guardar cambios"
        onSubmit={handleSubmit}
        initialValue={{
          match_date: match.match_date,
          match_time: match.match_time,
          opponent: match.opponent,
          location: match.location,
          address: match.address,
          home_away: match.home_away,
          score_own: match.score_own,
          score_opponent: match.score_opponent,
          result: match.result,
        }}
      />
      <View style={styles.actionsContainer}>
        <AppButton label="Eliminar partido" variant="secondary" onPress={confirmDelete} loading={deleting} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  error: { fontSize: typography.body, fontFamily: fonts.regular, textAlign: 'center', padding: spacing.lg },
  quickActions: { padding: spacing.lg, paddingBottom: 0, gap: spacing.sm },
  standaloneLabel: { fontSize: typography.caption, fontFamily: fonts.regular, fontStyle: 'italic' },
  actionsContainer: { padding: spacing.lg, paddingTop: 0 },
});
