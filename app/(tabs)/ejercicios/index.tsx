import { router, useFocusEffect } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import { ActivityIndicator, FlatList, Pressable, StyleSheet, Text, View } from 'react-native';

import { AppButton } from '../../../src/components/AppButton';
import { AppTextInput } from '../../../src/components/AppTextInput';
import { listExercises, type Exercise, type ExerciseCategory } from '../../../src/db/supabase/exercises';
import { useAuth } from '../../../src/hooks/useAuth';
import { fonts, minTouchSize, radius, spacing, typography, useTheme } from '../../../src/theme';
import { categoryLabel, EXERCISE_CATEGORIES } from '../../../src/utils/exerciseCategories';
import { MUSCLE_GROUPS_JOINTS, MUSCLE_GROUPS_MUSCLES } from '../../../src/utils/muscleGroups';

export default function EjerciciosScreen() {
  const { colors } = useTheme();
  const { session } = useAuth();
  const coachId = session?.user.id ?? null;
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<ExerciseCategory | null>(null);
  const [muscleGroupFilter, setMuscleGroupFilter] = useState<string[]>([]);
  const [showMuscleFilter, setShowMuscleFilter] = useState(false);

  function toggleMuscleGroupFilter(value: string) {
    setMuscleGroupFilter((current) =>
      current.includes(value) ? current.filter((v) => v !== value) : [...current, value]
    );
  }

  const load = useCallback(async () => {
    if (!coachId) return;
    setLoading(true);
    setError(null);
    try {
      setExercises(await listExercises(coachId));
    } catch (e) {
      setError(e instanceof Error ? e.message : 'No pudimos cargar los ejercicios.');
    } finally {
      setLoading(false);
    }
  }, [coachId]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  const filteredExercises = useMemo(() => {
    const query = search.trim().toLowerCase();
    return exercises.filter((e) => {
      if (categoryFilter && e.category !== categoryFilter) return false;
      if (muscleGroupFilter.length > 0 && !e.muscle_groups.some((g) => muscleGroupFilter.includes(g))) {
        return false;
      }
      if (query && !e.title.toLowerCase().includes(query)) return false;
      return true;
    });
  }, [exercises, search, categoryFilter, muscleGroupFilter]);

  if (loading && exercises.length === 0) {
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
      data={filteredExercises}
      keyExtractor={(item) => item.id}
      contentContainerStyle={[styles.listContent, { backgroundColor: colors.background }]}
      ListHeaderComponent={
        <View style={styles.header}>
          <AppButton label="+ Agregar ejercicio" onPress={() => router.push('/ejercicios/nuevo')} />
          <AppButton
            label="Ver rutinas"
            variant="secondary"
            onPress={() => router.push('/ejercicios/rutinas')}
          />

          <AppTextInput
            value={search}
            onChangeText={setSearch}
            placeholder="Buscar ejercicio por nombre"
            autoCapitalize="none"
          />

          <View style={styles.pillRow}>
            <Pressable
              onPress={() => setCategoryFilter(null)}
              style={[
                styles.pill,
                { borderColor: colors.border, backgroundColor: colors.surface },
                !categoryFilter && { backgroundColor: colors.primary, borderColor: colors.primary },
              ]}
            >
              <Text style={[styles.pillLabel, { color: !categoryFilter ? colors.primaryText : colors.text }]}>
                Todos
              </Text>
            </Pressable>
            {EXERCISE_CATEGORIES.map((option) => {
              const selected = option.value === categoryFilter;
              return (
                <Pressable
                  key={option.value}
                  onPress={() => setCategoryFilter(selected ? null : option.value)}
                  style={[
                    styles.pill,
                    { borderColor: colors.border, backgroundColor: colors.surface },
                    selected && { backgroundColor: colors.primary, borderColor: colors.primary },
                  ]}
                >
                  <Text style={[styles.pillLabel, { color: selected ? colors.primaryText : colors.text }]}>
                    {option.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          <Pressable onPress={() => setShowMuscleFilter((v) => !v)} style={styles.toggleFilterButton}>
            <Text style={[styles.toggleFilterLabel, { color: colors.link }]}>
              {showMuscleFilter ? 'Ocultar filtro por grupo muscular' : 'Filtrar por grupo muscular'}
              {muscleGroupFilter.length > 0 ? ` (${muscleGroupFilter.length})` : ''}
            </Text>
          </Pressable>

          {showMuscleFilter ? (
            <View style={styles.pillRow}>
              {[...MUSCLE_GROUPS_MUSCLES, ...MUSCLE_GROUPS_JOINTS].map((option) => {
                const selected = muscleGroupFilter.includes(option.value);
                return (
                  <Pressable
                    key={option.value}
                    onPress={() => toggleMuscleGroupFilter(option.value)}
                    style={[
                      styles.pill,
                      { borderColor: colors.border, backgroundColor: colors.surface },
                      selected && { backgroundColor: colors.primary, borderColor: colors.primary },
                    ]}
                  >
                    <Text
                      style={[styles.pillLabel, { color: selected ? colors.primaryText : colors.text }]}
                    >
                      {option.label}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          ) : null}
        </View>
      }
      ListEmptyComponent={
        <View style={styles.emptyContainer}>
          <Text style={[styles.emptyText, { color: colors.textMuted }]}>
            {exercises.length === 0
              ? 'Todavía no cargaste ejercicios.'
              : 'No encontramos ejercicios con esos filtros.'}
          </Text>
        </View>
      }
      renderItem={({ item }) => (
        <Pressable
          style={[styles.row, { borderBottomColor: colors.border }]}
          onPress={() =>
            router.push({ pathname: '/ejercicios/[exerciseId]', params: { exerciseId: item.id } })
          }
        >
          <Text style={[styles.rowTitle, { color: colors.text }]}>{item.title}</Text>
          <Text style={[styles.rowSub, { color: colors.textMuted }]}>
            {categoryLabel(item.category)}
            {item.duration_minutes ? ` · ${item.duration_minutes} min` : ''}
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
  pillRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  pill: {
    minHeight: minTouchSize,
    paddingHorizontal: spacing.md,
    borderRadius: radius,
    borderWidth: 1,
    justifyContent: 'center',
  },
  pillLabel: { fontSize: typography.caption, fontFamily: fonts.bold },
  toggleFilterButton: { minHeight: minTouchSize, justifyContent: 'center' },
  toggleFilterLabel: { fontSize: typography.caption, fontFamily: fonts.bold },
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
