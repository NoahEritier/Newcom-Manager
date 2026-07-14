import { router, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { ActivityIndicator, FlatList, Pressable, StyleSheet, Text, View } from 'react-native';

import { AppButton } from '../../../src/components/AppButton';
import { listStandaloneMatches, type Match } from '../../../src/db/supabase/matches';
import { useTeam } from '../../../src/hooks/useTeam';
import { fonts, spacing, typography, useTheme } from '../../../src/theme';

function formatDate(iso: string) {
  const [y, m, d] = iso.split('-');
  return `${d}/${m}/${y}`;
}

export default function PartidosSueltosScreen() {
  const { colors } = useTheme();
  const { teamId, isLoading: teamLoading, error: teamError } = useTeam();
  const [matches, setMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!teamId) return;
    setLoading(true);
    setError(null);
    try {
      setMatches(await listStandaloneMatches(teamId));
    } catch (e) {
      setError(e instanceof Error ? e.message : 'No pudimos cargar los partidos.');
    } finally {
      setLoading(false);
    }
  }, [teamId]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  if (teamLoading || (loading && matches.length === 0)) {
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
      data={matches}
      keyExtractor={(item) => item.id}
      contentContainerStyle={[styles.listContent, { backgroundColor: colors.background }]}
      ListHeaderComponent={
        <View style={styles.header}>
          <Text style={[styles.hint, { color: colors.textMuted }]}>
            Partidos que no pertenecen a ningún torneo cargado.
          </Text>
          <AppButton label="+ Agregar partido suelto" onPress={() => router.push('/torneos/partido/nuevo')} />
        </View>
      }
      ListEmptyComponent={
        <View style={styles.emptyContainer}>
          <Text style={[styles.emptyText, { color: colors.textMuted }]}>
            Todavía no cargaste partidos sueltos.
          </Text>
        </View>
      }
      renderItem={({ item }) => (
        <Pressable
          style={[styles.row, { borderBottomColor: colors.border }]}
          onPress={() => router.push({ pathname: '/torneos/partido/[matchId]', params: { matchId: item.id } })}
        >
          <Text style={[styles.rowTitle, { color: colors.text }]}>
            {formatDate(item.match_date)}
            {item.match_time ? ` · ${item.match_time.slice(0, 5)}` : ''} vs {item.opponent}
          </Text>
          <Text style={[styles.rowSub, { color: colors.textMuted }]}>
            {item.location ?? 'Sin lugar cargado'}
            {item.result ? ` · ${item.result}` : ''}
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
  hint: { fontSize: typography.caption, fontFamily: fonts.regular },
  emptyContainer: { padding: spacing.lg, alignItems: 'center' },
  emptyText: { fontSize: typography.body, fontFamily: fonts.regular, textAlign: 'center' },
  row: {
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
