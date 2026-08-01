import { router, useFocusEffect } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import { ActivityIndicator, FlatList, Image, Pressable, StyleSheet, Text, View } from 'react-native';

import { MaterialIcons } from '@expo/vector-icons';

import { AppButton } from '../../../src/components/AppButton';
import { Dropdown } from '../../../src/components/Dropdown';
import { ResultIcon } from '../../../src/components/ResultIcon';
import { listAllMatches } from '../../../src/db/supabase/matches';
import { listTournaments, type Tournament } from '../../../src/db/supabase/tournaments';
import { useTeam } from '../../../src/hooks/useTeam';
import { fonts, minTouchSize, radius, spacing, typography, useTheme } from '../../../src/theme';
import { formatDateRange } from '../../../src/utils/formatDate';
import {
  REGISTRATION_STATUSES,
  registrationStatusLabel,
  TOURNAMENT_TYPES,
  tournamentTypeLabel,
  type RegistrationStatus,
  type TournamentType,
} from '../../../src/utils/tournamentTypes';

function todayIso() {
  return new Date().toISOString().slice(0, 10);
}

type DateFilter = 'proximos' | 'pasados';

export default function TorneosScreen() {
  const { colors } = useTheme();
  const { teamId, isLoading: teamLoading, error: teamError } = useTeam();
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [summary, setSummary] = useState({ won: 0, lost: 0, drawn: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dateFilter, setDateFilter] = useState<DateFilter>('proximos');
  const [statusFilter, setStatusFilter] = useState<RegistrationStatus | null>(null);
  const [typeFilter, setTypeFilter] = useState<TournamentType | null>(null);
  const [filtersOpen, setFiltersOpen] = useState(false);

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
        if (dateFilter === 'proximos' ? relevantDate < today : relevantDate >= today) return false;
        if (statusFilter && t.registration_status !== statusFilter) return false;
        if (typeFilter && t.type !== typeFilter) return false;
        return true;
      })
      .sort((a, b) =>
        dateFilter === 'proximos'
          ? a.start_date.localeCompare(b.start_date)
          : b.start_date.localeCompare(a.start_date)
      );
  }, [tournaments, dateFilter, statusFilter, typeFilter]);

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
      numColumns={2}
      columnWrapperStyle={styles.columnWrapper}
      contentContainerStyle={[styles.listContent, { backgroundColor: colors.background }]}
      ListHeaderComponent={
        <View style={styles.header}>
          <AppButton label="+ Agregar torneo" onPress={() => router.push('/torneos/nuevo')} />

          <View style={[styles.summaryCard, { backgroundColor: colors.surface }]}>
            <Text style={[styles.summaryTitle, { color: colors.text }]}>Resumen de la temporada</Text>
            <View style={styles.summaryRow}>
              <View style={styles.summaryItem}>
                <ResultIcon kind="won" />
                <Text style={[styles.summaryNumber, { color: colors.success }]}>{summary.won}</Text>
                <Text style={[styles.summaryLabel, { color: colors.textMuted }]}>Ganados</Text>
              </View>
              <View style={styles.summaryItem}>
                <ResultIcon kind="lost" />
                <Text style={[styles.summaryNumber, { color: colors.danger }]}>{summary.lost}</Text>
                <Text style={[styles.summaryLabel, { color: colors.textMuted }]}>Perdidos</Text>
              </View>
              <View style={styles.summaryItem}>
                <ResultIcon kind="drawn" />
                <Text style={[styles.summaryNumber, { color: colors.textMuted }]}>{summary.drawn}</Text>
                <Text style={[styles.summaryLabel, { color: colors.textMuted }]}>Empatados</Text>
              </View>
            </View>
          </View>

          <Pressable
            style={[styles.filtersToggle, { borderColor: colors.border, backgroundColor: colors.surface }]}
            onPress={() => setFiltersOpen((v) => !v)}
          >
            <Text style={[styles.filtersToggleLabel, { color: colors.text }]}>Filtros</Text>
            <MaterialIcons
              name={filtersOpen ? 'expand-less' : 'expand-more'}
              size={24}
              color={colors.text}
            />
          </Pressable>

          {filtersOpen ? (
            <View style={styles.filtersPanel}>
              <Text style={[styles.filterLabel, { color: colors.textMuted }]}>Fecha</Text>
              <Dropdown
                value={dateFilter}
                options={[
                  { value: 'proximos', label: 'Próximos' },
                  { value: 'pasados', label: 'Pasados' },
                ]}
                onChange={(v) => setDateFilter(v as DateFilter)}
                title="Fecha"
              />

              <Text style={[styles.filterLabel, { color: colors.textMuted }]}>Estado de inscripción</Text>
              <Dropdown
                value={statusFilter ?? ''}
                options={[{ value: '', label: 'Todos' }, ...REGISTRATION_STATUSES]}
                onChange={(v) => setStatusFilter((v || null) as RegistrationStatus | null)}
                placeholder="Todos"
                title="Estado de inscripción"
              />

              <Text style={[styles.filterLabel, { color: colors.textMuted }]}>Tipo</Text>
              <Dropdown
                value={typeFilter ?? ''}
                options={[{ value: '', label: 'Todos' }, ...TOURNAMENT_TYPES]}
                onChange={(v) => setTypeFilter((v || null) as TournamentType | null)}
                placeholder="Todos"
                title="Tipo"
              />
            </View>
          ) : null}
        </View>
      }
      ListEmptyComponent={
        <View style={styles.emptyContainer}>
          <Text style={[styles.emptyText, { color: colors.textMuted }]}>
            No encontramos torneos con esos filtros.
          </Text>
        </View>
      }
      renderItem={({ item }) => (
        <Pressable
          style={[styles.card, { borderColor: colors.border, backgroundColor: colors.surface }]}
          onPress={() =>
            router.push({ pathname: '/torneos/[tournamentId]', params: { tournamentId: item.id } })
          }
        >
          {item.flyer_url ? (
            <Image source={{ uri: item.flyer_url }} style={styles.flyerThumb} />
          ) : (
            <View style={[styles.flyerPlaceholder, { backgroundColor: colors.background }]}>
              <Text style={[styles.flyerPlaceholderText, { color: colors.textMuted }]}>
                {tournamentTypeLabel(item.type)}
              </Text>
            </View>
          )}
          <View style={styles.cardBody}>
            <Text style={[styles.cardTitle, { color: colors.text }]} numberOfLines={2}>
              {item.title}
            </Text>
            <Text style={[styles.cardSub, { color: colors.textMuted }]}>
              {formatDateRange(item.start_date, item.end_date)}
            </Text>
            {item.location ? (
              <Text style={[styles.cardSub, { color: colors.textMuted }]} numberOfLines={1}>
                {item.location}
              </Text>
            ) : null}
            <View style={styles.badgeRow}>
              <Text style={[styles.badge, { color: colors.primary, borderColor: colors.primary }]}>
                {tournamentTypeLabel(item.type)}
              </Text>
              <Text style={[styles.badge, { color: colors.textMuted, borderColor: colors.border }]}>
                {registrationStatusLabel(item.registration_status)}
              </Text>
            </View>
          </View>
        </Pressable>
      )}
    />
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  listContent: { flexGrow: 1, padding: spacing.lg, gap: spacing.md },
  columnWrapper: { gap: spacing.md },
  header: { gap: spacing.md, marginBottom: spacing.sm },
  summaryCard: { borderRadius: radius, padding: spacing.md, gap: spacing.sm },
  summaryTitle: { fontSize: typography.body, fontFamily: fonts.bold },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-around' },
  summaryItem: { alignItems: 'center', gap: 2 },
  summaryNumber: { fontSize: typography.screenTitle, fontFamily: fonts.bold },
  summaryLabel: { fontSize: typography.caption, fontFamily: fonts.regular },
  filtersToggle: {
    minHeight: minTouchSize,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    borderRadius: radius,
    borderWidth: 1,
  },
  filtersToggleLabel: { fontSize: typography.body, fontFamily: fonts.bold },
  filtersPanel: { gap: spacing.md },
  filterLabel: { fontSize: typography.caption, fontFamily: fonts.bold },
  emptyContainer: { padding: spacing.lg, alignItems: 'center' },
  emptyText: { fontSize: typography.body, fontFamily: fonts.regular, textAlign: 'center' },
  card: {
    flex: 1,
    borderRadius: radius,
    borderWidth: 1,
    overflow: 'hidden',
  },
  flyerThumb: { width: '100%', aspectRatio: 1, backgroundColor: '#0000' },
  flyerPlaceholder: { width: '100%', aspectRatio: 1, alignItems: 'center', justifyContent: 'center' },
  flyerPlaceholderText: { fontSize: typography.caption, fontFamily: fonts.bold },
  cardBody: { padding: spacing.sm, gap: 2 },
  cardTitle: { fontSize: typography.body, fontFamily: fonts.bold },
  cardSub: { fontSize: typography.caption, fontFamily: fonts.regular },
  badgeRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs, marginTop: spacing.xs },
  badge: {
    fontSize: 11,
    fontFamily: fonts.bold,
    borderWidth: 1,
    borderRadius: 6,
    paddingHorizontal: spacing.xs,
    paddingVertical: 2,
  },
  error: { fontSize: typography.body, fontFamily: fonts.regular, textAlign: 'center', padding: spacing.lg },
});
