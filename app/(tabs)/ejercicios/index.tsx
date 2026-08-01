import { router, useFocusEffect } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import { ActivityIndicator, FlatList, Pressable, StyleSheet, Text, View } from 'react-native';

import { AppButton } from '../../../src/components/AppButton';
import { AppTextInput } from '../../../src/components/AppTextInput';
import { Dropdown } from '../../../src/components/Dropdown';
import { MultiSelectDropdown } from '../../../src/components/MultiSelectDropdown';
import { listExercises, type Exercise, type ExerciseCategory } from '../../../src/db/supabase/exercises';
import { useAuth } from '../../../src/hooks/useAuth';
import { fonts, minTouchSize, radius, spacing, typography, useTheme } from '../../../src/theme';
import { categoryLabel, EXERCISE_CATEGORIES } from '../../../src/utils/exerciseCategories';
import { MUSCLE_GROUPS_JOINTS, MUSCLE_GROUPS_MUSCLES } from '../../../src/utils/muscleGroups';

const CATEGORY_FILTER_OPTIONS = [{ value: '', label: 'Todas' }, ...EXERCISE_CATEGORIES];
const MUSCLE_FILTER_OPTIONS = [...MUSCLE_GROUPS_MUSCLES, ...MUSCLE_GROUPS_JOINTS];

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

          <Text style={[styles.filterLabel, { color: colors.textMuted }]}>Categoría</Text>
          <Dropdown
            value={categoryFilter ?? ''}
            options={CATEGORY_FILTER_OPTIONS}
            onChange={(v) => setCategoryFilter((v || null) as ExerciseCategory | null)}
            placeholder="Todas"
            title="Categoría"
          />

          <Text style={[styles.filterLabel, { color: colors.textMuted }]}>Grupo muscular / articulación</Text>
          <MultiSelectDropdown
            values={muscleGroupFilter}
            options={MUSCLE_FILTER_OPTIONS}
            onChange={setMuscleGroupFilter}
            placeholder="Todos"
            title="Grupo muscular / articulación"
          />
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
  filterLabel: { fontSize: typography.caption, fontFamily: fonts.bold },
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
