import { Stack, router, useFocusEffect, useLocalSearchParams } from 'expo-router';
import { useCallback, useState } from 'react';
import { ActivityIndicator, Alert, FlatList, Pressable, StyleSheet, Text, View } from 'react-native';

import { AppButton } from '../../../../../../src/components/AppButton';
import { StatusBadge } from '../../../../../../src/components/StatusBadge';
import { getMatch, type Match } from '../../../../../../src/db/supabase/matches';
import {
  getOrCreateStatSheet,
  listPlayerMatchStats,
  updateStatSheetStatus,
  type MatchStatSheet,
  type PlayerMatchStats,
} from '../../../../../../src/db/supabase/matchStats';
import { listPlayers, type Player } from '../../../../../../src/db/supabase/players';
import { fonts, minTouchSize, spacing, typography, useTheme } from '../../../../../../src/theme';

const STATUS_LABEL: Record<MatchStatSheet['status'], string> = {
  borrador: 'Sin empezar',
  escaneada: 'Escaneada',
  revisada: 'En revisión',
  confirmada: 'Confirmada',
};

export default function EstadisticasPartidoScreen() {
  const { colors } = useTheme();
  const { matchId } = useLocalSearchParams<{ matchId: string }>();

  const [match, setMatch] = useState<Match | null>(null);
  const [sheet, setSheet] = useState<MatchStatSheet | null>(null);
  const [players, setPlayers] = useState<Player[]>([]);
  const [statsByPlayer, setStatsByPlayer] = useState<Map<string, PlayerMatchStats>>(new Map());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [confirming, setConfirming] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const m = await getMatch(matchId);
      const [s, playerList] = await Promise.all([getOrCreateStatSheet(matchId), listPlayers(m.team_id)]);
      const stats = await listPlayerMatchStats(s.id);
      setMatch(m);
      setSheet(s);
      setPlayers(playerList);
      setStatsByPlayer(new Map(stats.map((row) => [row.player_id, row])));
    } catch (e) {
      setError(e instanceof Error ? e.message : 'No pudimos cargar las estadísticas.');
    } finally {
      setLoading(false);
    }
  }, [matchId]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  function confirmSheet() {
    if (!sheet) return;
    const loadedCount = statsByPlayer.size;
    Alert.alert(
      'Confirmar planilla',
      loadedCount < players.length
        ? `Todavía hay ${players.length - loadedCount} jugador(es) sin datos cargados. ¿Confirmar igual?`
        : 'Vas a marcar esta planilla como confirmada, fuente de verdad para las estadísticas del partido.',
      [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Confirmar', onPress: handleConfirmSheet },
      ]
    );
  }

  async function handleConfirmSheet() {
    if (!sheet) return;
    setConfirming(true);
    try {
      await updateStatSheetStatus(sheet.id, 'confirmada', new Date().toISOString());
      await load();
    } catch (e) {
      Alert.alert('Error', e instanceof Error ? e.message : 'No pudimos confirmar la planilla.');
    } finally {
      setConfirming(false);
    }
  }

  if (loading) {
    return (
      <View style={[styles.center, { backgroundColor: colors.background }]}>
        <ActivityIndicator color={colors.primary} />
      </View>
    );
  }

  if (error || !match || !sheet) {
    return (
      <View style={[styles.center, { backgroundColor: colors.background }]}>
        <Text style={[styles.error, { color: colors.danger }]}>{error ?? 'No encontramos el partido.'}</Text>
      </View>
    );
  }

  return (
    <FlatList
      data={players}
      keyExtractor={(item) => item.id}
      contentContainerStyle={[styles.listContent, { backgroundColor: colors.background }]}
      ListHeaderComponent={
        <View style={styles.header}>
          <Stack.Screen options={{ title: `Estadísticas vs ${match.opponent}` }} />
          <StatusBadge
            label={STATUS_LABEL[sheet.status]}
            tone={sheet.status === 'confirmada' ? 'success' : 'default'}
          />
          <Text style={[styles.hint, { color: colors.textMuted }]}>
            Tocá un jugador para escanear su planilla o cargar sus datos a mano.
          </Text>
        </View>
      }
      ListEmptyComponent={
        <Text style={[styles.emptyText, { color: colors.textMuted, padding: spacing.lg }]}>
          No hay jugadores cargados en el equipo.
        </Text>
      }
      renderItem={({ item }) => {
        const stats = statsByPlayer.get(item.id);
        return (
          <Pressable
            style={[styles.row, { borderBottomColor: colors.border }]}
            onPress={() =>
              router.push({
                pathname: '/torneos/partido/estadisticas/[matchId]/[playerId]',
                params: { matchId, playerId: item.id },
              })
            }
          >
            <Text style={[styles.rowTitle, { color: colors.text }]}>
              {item.full_name}
              {item.jersey_number != null ? ` · #${item.jersey_number}` : ''}
            </Text>
            <StatusBadge
              label={stats ? 'Cargado' : 'Sin cargar'}
              tone={stats ? 'success' : 'default'}
            />
          </Pressable>
        );
      }}
      ListFooterComponent={
        <View style={styles.footer}>
          <AppButton
            label="Confirmar planilla del partido"
            onPress={confirmSheet}
            loading={confirming}
            disabled={confirming || sheet.status === 'confirmada'}
          />
        </View>
      }
    />
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  listContent: { flexGrow: 1 },
  header: { padding: spacing.lg, gap: spacing.sm },
  hint: { fontSize: typography.caption, fontFamily: fonts.regular },
  emptyText: { fontSize: typography.body, fontFamily: fonts.regular, textAlign: 'center' },
  row: {
    minHeight: minTouchSize,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
  },
  rowTitle: { fontSize: typography.body, fontFamily: fonts.bold, flex: 1 },
  footer: { padding: spacing.lg },
  error: { fontSize: typography.body, fontFamily: fonts.regular, textAlign: 'center', padding: spacing.lg },
});
