import { useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { ActivityIndicator, FlatList, StyleSheet, Text, View } from 'react-native';

import { getAttendanceStats, type PlayerAttendanceStat } from '../../../src/db/local/attendance';
import { useTeam } from '../../../src/hooks/useTeam';
import { fonts, spacing, typography, useTheme } from '../../../src/theme';

export default function PorcentajeAsistenciaScreen() {
  const { colors } = useTheme();
  const { teamId } = useTeam();
  const [stats, setStats] = useState<PlayerAttendanceStat[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!teamId) return;
    setLoading(true);
    setStats(await getAttendanceStats(teamId));
    setLoading(false);
  }, [teamId]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  if (loading) {
    return (
      <View style={[styles.center, { backgroundColor: colors.background }]}>
        <ActivityIndicator color={colors.primary} />
      </View>
    );
  }

  return (
    <FlatList
      data={stats}
      keyExtractor={(item) => item.player_id}
      contentContainerStyle={[styles.listContent, { backgroundColor: colors.background }]}
      ListHeaderComponent={
        <Text style={[styles.hint, { color: colors.textMuted }]}>
          Basado en las sesiones de los últimos 30 días guardadas en este dispositivo.
        </Text>
      }
      ListEmptyComponent={
        <Text style={[styles.emptyText, { color: colors.textMuted }]}>
          Todavía no hay datos de asistencia para mostrar.
        </Text>
      }
      renderItem={({ item }) => {
        const pct = item.session_count > 0 ? Math.round((item.present_count / item.session_count) * 100) : null;
        return (
          <View style={[styles.row, { borderBottomColor: colors.border }]}>
            <Text style={[styles.rowName, { color: colors.text }]}>{item.full_name}</Text>
            <Text style={[styles.rowPct, { color: pct === null ? colors.textMuted : colors.text }]}>
              {pct === null ? 'Sin datos' : `${pct}% (${item.present_count}/${item.session_count})`}
            </Text>
          </View>
        );
      }}
    />
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  listContent: { flexGrow: 1, padding: spacing.lg, gap: spacing.sm },
  hint: { fontSize: typography.caption, fontFamily: fonts.regular, marginBottom: spacing.sm },
  emptyText: { fontSize: typography.body, fontFamily: fonts.regular, textAlign: 'center' },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
  },
  rowName: { fontSize: typography.body, fontFamily: fonts.bold },
  rowPct: { fontSize: typography.body, fontFamily: fonts.bold },
});
