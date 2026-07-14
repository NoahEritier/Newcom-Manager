import { router, useFocusEffect } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import { ActivityIndicator, FlatList, Pressable, StyleSheet, Text, View } from 'react-native';

import { AppButton } from '../../../src/components/AppButton';
import { listAllMatches } from '../../../src/db/supabase/matches';
import { listTournaments, type Tournament } from '../../../src/db/supabase/tournaments';
import { useTeam } from '../../../src/hooks/useTeam';
import { fonts, minTouchSize, radius, spacing, typography, useTheme } from '../../../src/theme';

function formatDate(iso: string) {
  const [y, m, d] = iso.split('-');
  return `${d}/${m}/${y}`;
}

function todayIso() {
  return new Date().toISOString().slice(0, 10);
}

type Filter = 'proximos' | 'pasados';

export default function TorneosScreen() {
  const { colors } = useTheme();
  const { teamId, isLoading: teamLoading, error: teamError } = useTeam();
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [summary, setSummary] = useState({ won: 0, lost: 0, drawn: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<Filter>('proximos');

  const load = useCallback(async () => {
    if (!teamId) return;
    setLoading(true);
    setError(null);
    try {
      const [tournamentList, matches] = await Promise.all([
        listTournaments(teamId),
        listAllMatches(teamId),
      ]);
      setTournaments(tournamentList);
      let won = 0;
      let lost = 0;
      let drawn = 0;
      for (const m of matches) {
        if (m.score_own === null || m.score_opponent === null) continue;
        if (m.score_own > m.score_opponent) won++;
        else if (m.score_own < m.score_opponent) lost++;
        else drawn++;
      }
      setSummary({ won, lost, drawn });
    } catch (e) {
      setError(e instanceof Error ? e.message : 'No pudimos cargar los torneos.');
    } finally {
      setLoading(false);
    }
  }, [teamId]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  const filtered = useMemo(() => {
    const today = todayIso();
    return tournaments
      .filter((t) => {
        const relevantDate = t.end_date ?? t.start_date;
        return filter === 'proximos' ? relevantDate >= today : relevantDate < today;
      })
      .sort((a, b) =>
        filter === 'proximos'
          ? a.start_date.localeCompare(b.start_date)
          : b.start_date.localeCompare(a.start_date)
      );
  }, [tournaments, filter]);

  if (teamLoading || (loading && tournaments.length === 0)) {
    return (
      <View style={[styles.center, { backgroundColor: colors.background }]}>
        <ActivityIndicator color={colors.primary} />
      </View>
    );
  }

  if (teamError || error) {
    return (
      <View style={[styles.center, { backgroundColor: colors.background }]}>
        <Text style={[styles.error, { color: colors.danger }]}>{teamError ?? error}</Text>
      </View>
    );
  }

  return (
    <FlatList
      data={filtered}
      keyExtractor={(item) => item.id}
      contentContainerStyle={[styles.listContent, { backgroundColor: colors.background }]}
      ListHeaderComponent={
        <View style={styles.header}>
          <AppButton label="+ Agregar torneo" onPress={() => router.push('/torneos/nuevo')} />
          <AppButton
            label="Partidos sueltos"
            variant="secondary"
            onPress={() => router.push('/torneos/partidos')}
          />

          <View style={[styles.summaryCard, { backgroundColor: colors.surface }]}>
            <Text style={[styles.summaryTitle, { color: colors.text }]}>Resumen de la temporada</Text>
            <View style={styles.summaryRow}>
              <View style={styles.summaryItem}>
                <Text style={[styles.summaryNumber, { color: colors.success }]}>{summary.won}</Text>
                <Text style={[styles.summaryLabel, { color: colors.textMuted }]}>Ganados</Text>
              </View>
              <View style={styles.summaryItem}>
                <Text style={[styles.summaryNumber, { color: colors.danger }]}>{summary.lost}</Text>
                <Text style={[styles.summaryLabel, { color: colors.textMuted }]}>Perdidos</Text>
              </View>
              <View style={styles.summaryItem}>
                <Text style={[styles.summaryNumber, { color: colors.textMuted }]}>{summary.drawn}</Text>
                <Text style={[styles.summaryLabel, { color: colors.textMuted }]}>Empatados</Text>
              </View>
            </View>
          </View>

          <View style={styles.pillRow}>
            <Pressable
              onPress={() => setFilter('proximos')}
              style={[
                styles.pill,
                { borderColor: colors.border, backgroundColor: colors.surface },
                filter === 'proximos' && { backgroundColor: colors.primary, borderColor: colors.primary },
              ]}
            >
              <Text style={[styles.pillLabel, { color: filter === 'proximos' ? colors.primaryText : colors.text }]}>
                Próximos
              </Text>
            </Pressable>
            <Pressable
              onPress={() => setFilter('pasados')}
              style={[
                styles.pill,
                { borderColor: colors.border, backgroundColor: colors.surface },
                filter === 'pasados' && { backgroundColor: colors.primary, borderColor: colors.primary },
              ]}
            >
              <Text style={[styles.pillLabel, { color: filter === 'pasados' ? colors.primaryText : colors.text }]}>
                Pasados
              </Text>
            </Pressable>
          </View>
        </View>
      }
      ListEmptyComponent={
        <View style={styles.emptyContainer}>
          <Text style={[styles.emptyText, { color: colors.textMuted }]}>
            {filter === 'proximos' ? 'No hay torneos próximos.' : 'No hay torneos pasados.'}
          </Text>
        </View>
      }
      renderItem={({ item }) => (
        <Pressable
          style={[styles.row2, { borderBottomColor: colors.border }]}
          onPress={() =>
            router.push({ pathname: '/torneos/[tournamentId]', params: { tournamentId: item.id } })
          }
        >
          <Text style={[styles.rowTitle, { color: colors.text }]}>{item.title}</Text>
          <Text style={[styles.rowSub, { color: colors.textMuted }]}>
            {formatDate(item.start_date)}
            {item.end_date ? ` - ${formatDate(item.end_date)}` : ''}
            {item.location ? ` · ${item.location}` : ''}
            {' · '}
            {item.is_paid ? 'Pagado' : 'Pendiente de pago'}
          </Text>
        </Pressable>
      )}
    />
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  listContent: { flexGrow: 1 },
  header: { padding: spacing.lg, gap: spacing.md },
  summaryCard: { borderRadius: radius, padding: spacing.md, gap: spacing.sm },
  summaryTitle: { fontSize: typography.body, fontFamily: fonts.bold },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-around' },
  summaryItem: { alignItems: 'center' },
  summaryNumber: { fontSize: typography.screenTitle, fontFamily: fonts.bold },
  summaryLabel: { fontSize: typography.caption, fontFamily: fonts.regular },
  pillRow: { flexDirection: 'row', gap: spacing.sm },
  pill: {
    minHeight: minTouchSize,
    paddingHorizontal: spacing.md,
    borderRadius: radius,
    borderWidth: 1,
    justifyContent: 'center',
    flex: 1,
    alignItems: 'center',
  },
  pillLabel: { fontSize: typography.caption, fontFamily: fonts.bold },
  emptyContainer: { padding: spacing.lg, alignItems: 'center' },
  emptyText: { fontSize: typography.body, fontFamily: fonts.regular, textAlign: 'center' },
  row2: {
    minHeight: 64,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    justifyContent: 'center',
    gap: 2,
  },
  rowTitle: { fontSize: typography.body, fontFamily: fonts.bold },
  rowSub: { fontSize: typography.caption, fontFamily: fonts.regular },
  error: { fontSize: typography.body, fontFamily: fonts.regular, textAlign: 'center', padding: spacing.lg },
});
