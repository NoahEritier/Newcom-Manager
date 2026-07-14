import { router, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { ActivityIndicator, FlatList, Pressable, StyleSheet, Text, View } from 'react-native';

import { AppButton } from '../../../../src/components/AppButton';
import { listRoutines, updateRoutine, type Routine } from '../../../../src/db/supabase/routines';
import { useAuth } from '../../../../src/hooks/useAuth';
import { fonts, spacing, typography, useTheme } from '../../../../src/theme';

export default function RutinasScreen() {
  const { colors } = useTheme();
  const { session } = useAuth();
  const coachId = session?.user.id ?? null;
  const [routines, setRoutines] = useState<Routine[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!coachId) return;
    setLoading(true);
    setError(null);
    try {
      setRoutines(await listRoutines(coachId));
    } catch (e) {
      setError(e instanceof Error ? e.message : 'No pudimos cargar las rutinas.');
    } finally {
      setLoading(false);
    }
  }, [coachId]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  async function toggleFavorite(routine: Routine) {
    await updateRoutine(routine.id, { title: routine.title, is_favorite: !routine.is_favorite });
    load();
  }

  if (loading && routines.length === 0) {
    return (
      <View style={[styles.center, { backgroundColor: colors.background }]}>
        <ActivityIndicator color={colors.primary} />
      </View>
    );
  }

  if (error) {
    return (
      <View style={[styles.center, { backgroundColor: colors.background }]}>
        <Text style={[styles.error, { color: colors.danger }]}>{error}</Text>
      </View>
    );
  }

  return (
    <FlatList
      data={routines}
      keyExtractor={(item) => item.id}
      contentContainerStyle={[styles.listContent, { backgroundColor: colors.background }]}
      ListHeaderComponent={
        <View style={styles.header}>
          <AppButton label="+ Nueva rutina" onPress={() => router.push('/ejercicios/rutinas/nueva')} />
        </View>
      }
      ListEmptyComponent={
        <View style={styles.emptyContainer}>
          <Text style={[styles.emptyText, { color: colors.textMuted }]}>
            Todavía no armaste ninguna rutina.
          </Text>
        </View>
      }
      renderItem={({ item }) => (
        <View style={[styles.row, { borderBottomColor: colors.border }]}>
          <Pressable
            style={styles.rowMain}
            onPress={() =>
              router.push({ pathname: '/ejercicios/rutinas/[routineId]', params: { routineId: item.id } })
            }
          >
            <Text style={[styles.rowTitle, { color: colors.text }]}>{item.title}</Text>
          </Pressable>
          <Pressable onPress={() => toggleFavorite(item)} style={styles.favButton}>
            <Text style={[styles.favIcon, { color: item.is_favorite ? colors.accent : colors.textMuted }]}>
              {item.is_favorite ? '★' : '☆'}
            </Text>
          </Pressable>
        </View>
      )}
    />
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  listContent: { flexGrow: 1 },
  header: { padding: spacing.lg },
  emptyContainer: { padding: spacing.lg, alignItems: 'center' },
  emptyText: { fontSize: typography.body, fontFamily: fonts.regular, textAlign: 'center' },
  row: {
    minHeight: 56,
    paddingHorizontal: spacing.lg,
    borderBottomWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  rowMain: { flex: 1, paddingVertical: spacing.md },
  rowTitle: { fontSize: typography.body, fontFamily: fonts.bold },
  favButton: { minWidth: 48, minHeight: 48, alignItems: 'center', justifyContent: 'center' },
  favIcon: { fontSize: 22 },
  error: { fontSize: typography.body, fontFamily: fonts.regular, textAlign: 'center', padding: spacing.lg },
});
