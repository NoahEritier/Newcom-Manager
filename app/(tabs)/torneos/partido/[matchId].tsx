import * as Print from 'expo-print';
import { Stack, router, useLocalSearchParams } from 'expo-router';
import * as Sharing from 'expo-sharing';
import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Linking, ScrollView, StyleSheet, Text, View } from 'react-native';

import { AppButton } from '../../../../src/components/AppButton';
import { DetailRow, DetailSection } from '../../../../src/components/DetailView';
import { MatchForm } from '../../../../src/components/MatchForm';
import {
  deleteMatch,
  getMatch,
  updateMatch,
  type Match,
  type MatchInput,
} from '../../../../src/db/supabase/matches';
import { listPlayers } from '../../../../src/db/supabase/players';
import { fonts, spacing, typography, useTheme } from '../../../../src/theme';
import { buildStatSheetHtml } from '../../../../src/utils/statSheetPdf';
import { formatDate } from '../../../../src/utils/formatDate';
import { openWhatsAppMessage } from '../../../../src/utils/whatsapp';

const HOME_AWAY_LABEL: Record<'local' | 'visitante', string> = {
  local: 'Local',
  visitante: 'Visitante',
};

export default function EditarPartidoScreen() {
  const { colors } = useTheme();
  const { matchId } = useLocalSearchParams<{ matchId: string }>();
  const [match, setMatch] = useState<Match | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [editing, setEditing] = useState(false);
  const [generatingSheet, setGeneratingSheet] = useState(false);

  const load = useCallback(() => {
    return getMatch(matchId)
      .then(setMatch)
      .catch((e) => setError(e instanceof Error ? e.message : 'No pudimos cargar el partido.'))
      .finally(() => setLoading(false));
  }, [matchId]);

  useEffect(() => {
    load();
  }, [load]);

  async function handleSubmit(input: Omit<MatchInput, 'tournament_id'>) {
    if (!match) return;
    await updateMatch(matchId, { ...input, tournament_id: match.tournament_id });
    await load();
    setEditing(false);
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

  async function handleGenerateStatSheet() {
    if (!match) return;
    setGeneratingSheet(true);
    try {
      const players = await listPlayers(match.team_id);
      if (players.length === 0) {
        Alert.alert('Sin jugadores', 'No hay jugadores cargados en el equipo para generar la planilla.');
        return;
      }
      const html = buildStatSheetHtml(
        {
          opponent: match.opponent,
          matchDateLabel:
            formatDate(match.match_date) + (match.match_time ? ` ${match.match_time.slice(0, 5)}hs` : ''),
        },
        players.map((p) => ({ id: p.id, full_name: p.full_name, jersey_number: p.jersey_number }))
      );
      const { uri } = await Print.printToFileAsync({ html });
      const canShare = await Sharing.isAvailableAsync();
      if (canShare) {
        await Sharing.shareAsync(uri, { mimeType: 'application/pdf', dialogTitle: 'Planilla de estadísticas' });
      } else {
        Alert.alert('Listo', 'La planilla se generó pero este dispositivo no puede compartir archivos.');
      }
    } catch {
      Alert.alert('Error', 'No pudimos generar la planilla. Probá de nuevo.');
    } finally {
      setGeneratingSheet(false);
    }
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

  if (editing) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <Stack.Screen options={{ title: `vs ${match.opponent}` }} />
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
          <AppButton label="Cancelar" variant="secondary" onPress={() => setEditing(false)} />
        </View>
      </View>
    );
  }

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.background }]}>
      <Stack.Screen options={{ title: `vs ${match.opponent}` }} />
      <View style={styles.content}>
        <Text style={[styles.title, { color: colors.text }]}>vs {match.opponent}</Text>

        <DetailSection>
          <DetailRow
            label="Fecha"
            value={formatDate(match.match_date) + (match.match_time ? ` · ${match.match_time.slice(0, 5)}hs` : '')}
          />
          <DetailRow label="Local o visitante" value={match.home_away ? HOME_AWAY_LABEL[match.home_away] : null} />
          <DetailRow label="Lugar" value={match.location} />
          <DetailRow label="Dirección" value={match.address} />
          <DetailRow label="Resultado" value={match.result} />
        </DetailSection>

        <View style={styles.actions}>
          <AppButton label="Editar" onPress={() => setEditing(true)} />
          <AppButton
            label="Generar planilla de estadísticas (PDF)"
            variant="secondary"
            onPress={handleGenerateStatSheet}
            loading={generatingSheet}
            disabled={generatingSheet}
          />
          <AppButton
            label="Cargar estadísticas"
            variant="secondary"
            onPress={() =>
              router.push({ pathname: '/torneos/partido/estadisticas/[matchId]', params: { matchId } })
            }
          />
          <AppButton label="Enviar convocatoria por WhatsApp" variant="secondary" onPress={handleShare} />
          {match.address ? (
            <AppButton label="Abrir ubicación en Maps" variant="secondary" onPress={handleOpenMaps} />
          ) : null}
          <AppButton
            label="Eliminar partido"
            variant="secondary"
            onPress={confirmDelete}
            loading={deleting}
          />
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: spacing.lg, gap: spacing.sm },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  error: { fontSize: typography.body, fontFamily: fonts.regular, textAlign: 'center', padding: spacing.lg },
  title: { fontSize: typography.screenTitle, fontFamily: fonts.bold },
  actions: { gap: spacing.sm, marginTop: spacing.md, marginBottom: spacing.xl },
  actionsContainer: { padding: spacing.lg, paddingTop: 0 },
});
