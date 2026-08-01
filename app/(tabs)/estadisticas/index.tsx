import { MaterialIcons } from '@expo/vector-icons';
import { router, useFocusEffect } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import { ActivityIndicator, Dimensions, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { BarChart } from 'react-native-chart-kit';

import { Dropdown } from '../../../src/components/Dropdown';
import { StatusBadge } from '../../../src/components/StatusBadge';
import {
  getConfirmedStatsSummary,
  listMatchesWithStatOverview,
  STAT_SHEET_STATUS_LABEL,
  type MatchStatOverview,
  type StatsSummary,
  type StatSheetStatus,
} from '../../../src/db/supabase/matchStats';
import { listTournaments, type Tournament } from '../../../src/db/supabase/tournaments';
import { useTeam } from '../../../src/hooks/useTeam';
import { fonts, minTouchSize, radius, spacing, typography, useTheme } from '../../../src/theme';
import { hexToRgba } from '../../../src/utils/color';
import { formatDate } from '../../../src/utils/formatDate';
import type { StatFieldKey } from '../../../src/utils/statFields';

const STATUS_FILTERS: { value: StatSheetStatus | 'sin_planilla'; label: string }[] = [
  { value: 'sin_planilla', label: 'Sin empezar' },
  { value: 'escaneada', label: 'Escaneada' },
  { value: 'revisada', label: 'En revisión' },
  { value: 'confirmada', label: 'Confirmada' },
];

const RANKING_METRICS: { value: StatFieldKey; label: string }[] = [
  { value: 'attack_points', label: 'Puntos de ataque' },
  { value: 'serve_aces', label: 'Aces' },
  { value: 'attack_errors', label: 'Errores de ataque' },
  { value: 'serve_errors', label: 'Errores de saque' },
];

const screenWidth = Dimensions.get('window').width;

export default function EstadisticasScreen() {
  const { colors } = useTheme();
  const { teamId, isLoading: teamLoading } = useTeam();

  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [matches, setMatches] = useState<MatchStatOverview[]>([]);
  const [summary, setSummary] = useState<StatsSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [filtersOpen, setFiltersOpen] = useState(false);
  const [tournamentFilter, setTournamentFilter] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<StatSheetStatus | 'sin_planilla' | null>(null);
  const [rankingMetric, setRankingMetric] = useState<StatFieldKey>('attack_points');

  const load = useCallback(async () => {
    if (!teamId) return;
    setLoading(true);
    setError(null);
    try {
      const [tournamentList, matchList, statsSummary] = await Promise.all([
        listTournaments(teamId),
        listMatchesWithStatOverview(teamId),
        getConfirmedStatsSummary(teamId, tournamentFilter),
      ]);
      setTournaments(tournamentList);
      setMatches(matchList);
      setSummary(statsSummary);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'No pudimos cargar las estadísticas.');
    } finally {
      setLoading(false);
    }
  }, [teamId, tournamentFilter]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  const filteredMatches = useMemo(() => {
    return matches.filter((m) => {
      if (tournamentFilter && m.tournament_id !== tournamentFilter) return false;
      if (statusFilter) {
        const current = m.sheet_status ?? 'sin_planilla';
        if (current !== statusFilter) return false;
      }
      return true;
    });
  }, [matches, tournamentFilter, statusFilter]);

  const chartConfig = {
    backgroundGradientFrom: colors.surface,
    backgroundGradientTo: colors.surface,
    decimalPlaces: 0,
    color: (opacity = 1) => hexToRgba(colors.primary, opacity),
    labelColor: (opacity = 1) => hexToRgba(colors.text, opacity),
    barPercentage: 0.6,
    propsForLabels: { fontSize: 11 },
  };

  const totalsChartData = summary
    ? {
        labels: ['Aces', 'Err. saque', 'Pts ataque', 'Err. ataque', 'Faltas'],
        datasets: [
          {
            data: [
              summary.totals.serve_aces,
              summary.totals.serve_errors,
              summary.totals.attack_points,
              summary.totals.attack_errors,
              summary.totals.double_touch_faults +
                summary.totals.invasion_faults +
                summary.totals.flecha_faults,
            ],
          },
        ],
      }
    : null;

  const rankingRows = useMemo(() => {
    if (!summary) return [];
    return [...summary.byPlayer]
      .sort((a, b) => b[rankingMetric] - a[rankingMetric])
      .slice(0, 5)
      .filter((p) => p[rankingMetric] > 0);
  }, [summary, rankingMetric]);

  const rankingChartData =
    rankingRows.length > 0
      ? {
          labels: rankingRows.map((p) => p.full_name.split(' ')[0]),
          datasets: [{ data: rankingRows.map((p) => p[rankingMetric]) }],
        }
      : null;

  const hasConfirmedData = !!summary && summary.byPlayer.length > 0;

  if (teamLoading || (loading && matches.length === 0)) {
    return (
      <View style={[styles.center, { backgroundColor: colors.background }]}>
        <ActivityIndicator color={colors.primary} />
      </View>
    );
  }

  if (error) {
    return (
      <View style={[styles.center, { backgroundColor: colors.background }]}>
        <Text style={[styles.errorText, { color: colors.danger }]}>{error}</Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={{ backgroundColor: colors.background }}
      contentContainerStyle={styles.container}
    >
      <Pressable
        style={[styles.filtersToggle, { borderColor: colors.border, backgroundColor: colors.surface }]}
        onPress={() => setFiltersOpen((v) => !v)}
      >
        <Text style={[styles.filtersToggleLabel, { color: colors.text }]}>Filtros</Text>
        <MaterialIcons name={filtersOpen ? 'expand-less' : 'expand-more'} size={24} color={colors.text} />
      </Pressable>

      {filtersOpen ? (
        <View style={styles.filtersPanel}>
          <Text style={[styles.filterLabel, { color: colors.textMuted }]}>Torneo</Text>
          <Dropdown
            value={tournamentFilter ?? ''}
            options={[{ value: '', label: 'Todos' }, ...tournaments.map((t) => ({ value: t.id, label: t.title }))]}
            onChange={(v) => setTournamentFilter(v || null)}
            placeholder="Todos"
            title="Torneo"
          />

          <Text style={[styles.filterLabel, { color: colors.textMuted }]}>Estado de planilla</Text>
          <Dropdown
            value={statusFilter ?? ''}
            options={[{ value: '', label: 'Todas' }, ...STATUS_FILTERS]}
            onChange={(v) => setStatusFilter((v || null) as StatSheetStatus | 'sin_planilla' | null)}
            placeholder="Todas"
            title="Estado de planilla"
          />
        </View>
      ) : null}

      <Text style={[styles.sectionTitle, { color: colors.text }]}>Resumen del equipo</Text>
      {!hasConfirmedData ? (
        <Text style={[styles.emptyText, { color: colors.textMuted }]}>
          Todavía no hay planillas confirmadas
          {tournamentFilter ? ' para este torneo' : ''}. El resumen se arma solo con planillas ya
          confirmadas, no con borradores.
        </Text>
      ) : (
        <>
          {totalsChartData ? (
            <BarChart
              data={totalsChartData}
              width={screenWidth - spacing.lg * 2}
              height={200}
              chartConfig={chartConfig}
              yAxisLabel=""
              yAxisSuffix=""
              fromZero
              showValuesOnTopOfBars
              style={styles.chart}
            />
          ) : null}

          <Text style={[styles.sectionTitle, { color: colors.text, marginTop: spacing.lg }]}>
            Ranking de jugadores
          </Text>
          <Dropdown
            value={rankingMetric}
            options={RANKING_METRICS}
            onChange={(v) => setRankingMetric(v as StatFieldKey)}
            title="Métrica de ranking"
          />
          {rankingChartData ? (
            <BarChart
              data={rankingChartData}
              width={screenWidth - spacing.lg * 2}
              height={200}
              chartConfig={chartConfig}
              yAxisLabel=""
              yAxisSuffix=""
              fromZero
              showValuesOnTopOfBars
              style={styles.chart}
            />
          ) : (
            <Text style={[styles.emptyText, { color: colors.textMuted }]}>
              Nadie tiene datos cargados todavía para "{RANKING_METRICS.find((m) => m.value === rankingMetric)?.label}".
            </Text>
          )}
        </>
      )}

      <Text style={[styles.sectionTitle, { color: colors.text, marginTop: spacing.lg }]}>
        Partidos ({filteredMatches.length})
      </Text>
      {filteredMatches.length === 0 ? (
        <Text style={[styles.emptyText, { color: colors.textMuted }]}>
          No encontramos partidos con esos filtros.
        </Text>
      ) : (
        filteredMatches.map((item) => (
          <Pressable
            key={item.match_id}
            style={[styles.matchRow, { borderBottomColor: colors.border }]}
            onPress={() =>
              router.push({
                pathname: '/torneos/partido/estadisticas/[matchId]',
                params: { matchId: item.match_id },
              })
            }
          >
            <View style={styles.matchInfo}>
              <Text style={[styles.matchTitle, { color: colors.text }]}>
                {formatDate(item.match_date)} vs {item.opponent}
              </Text>
              <Text style={[styles.matchSub, { color: colors.textMuted }]}>{item.tournament_title}</Text>
            </View>
            <StatusBadge
              label={item.sheet_status ? STAT_SHEET_STATUS_LABEL[item.sheet_status] : 'Sin empezar'}
              tone={item.sheet_status === 'confirmada' ? 'success' : 'default'}
            />
          </Pressable>
        ))
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  container: { padding: spacing.lg, gap: spacing.md },
  errorText: { fontSize: typography.body, fontFamily: fonts.regular, textAlign: 'center', padding: spacing.lg },
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
  sectionTitle: { fontSize: typography.sectionTitle, fontFamily: fonts.bold },
  emptyText: { fontSize: typography.body, fontFamily: fonts.regular },
  chart: { borderRadius: radius, marginTop: spacing.sm },
  matchRow: {
    minHeight: 64,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
  },
  matchInfo: { flex: 1, gap: 2 },
  matchTitle: { fontSize: typography.body, fontFamily: fonts.bold },
  matchSub: { fontSize: typography.caption, fontFamily: fonts.regular },
});
