import { Stack, router, useFocusEffect, useLocalSearchParams } from 'expo-router';
import { useCallback, useState } from 'react';
import { ActivityIndicator, Alert, FlatList, Pressable, StyleSheet, Text, View } from 'react-native';

import { AppButton } from '../../../../src/components/AppButton';
import { listExercises, type Exercise } from '../../../../src/db/supabase/exercises';
import {
  addExerciseToRoutine,
  deleteRoutine,
  duplicateRoutine,
  getRoutine,
  listRoutineExercises,
  removeRoutineExercise,
  swapRoutineExercisePositions,
  updateRoutine,
  type Routine,
  type RoutineExercise,
} from '../../../../src/db/supabase/routines';
import { useAuth } from '../../../../src/hooks/useAuth';
import { fonts, minTouchSize, spacing, typography, useTheme } from '../../../../src/theme';

export default function RutinaDetalleScreen() {
  const { colors } = useTheme();
  const { routineId } = useLocalSearchParams<{ routineId: string }>();
  const { session } = useAuth();
  const coachId = session?.user.id ?? null;

  const [routine, setRoutine] = useState<Routine | null>(null);
  const [routineExercises, setRoutineExercises] = useState<RoutineExercise[]>([]);
  const [library, setLibrary] = useState<Exercise[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    if (!coachId) return;
    setLoading(true);
    setError(null);
    try {
      const [r, items, allExercises] = await Promise.all([
        getRoutine(routineId),
        listRoutineExercises(routineId),
        listExercises(coachId),
      ]);
      setRoutine(r);
      setRoutineExercises(items);
      setLibrary(allExercises);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'No pudimos cargar la rutina.');
    } finally {
      setLoading(false);
    }
  }, [routineId, coachId]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  async function toggleFavorite() {
    if (!routine) return;
    await updateRoutine(routine.id, { title: routine.title, is_favorite: !routine.is_favorite });
    load();
  }

  async function handleAdd(exerciseId: string) {
    setBusy(true);
    try {
      await addExerciseToRoutine(routineId, exerciseId, routineExercises.length);
      setRoutineExercises(await listRoutineExercises(routineId));
    } finally {
      setBusy(false);
    }
  }

  async function handleRemove(routineExerciseId: string) {
    setBusy(true);
    try {
      await removeRoutineExercise(routineExerciseId);
      setRoutineExercises(await listRoutineExercises(routineId));
    } finally {
      setBusy(false);
    }
  }

  async function handleMove(index: number, direction: -1 | 1) {
    const targetIndex = index + direction;
    if (targetIndex < 0 || targetIndex >= routineExercises.length) return;
    setBusy(true);
    try {
      await swapRoutineExercisePositions(routineExercises[index], routineExercises[targetIndex]);
      setRoutineExercises(await listRoutineExercises(routineId));
    } finally {
      setBusy(false);
    }
  }

  async function handleDuplicate() {
    setBusy(true);
    try {
      const newId = await duplicateRoutine(routineId);
      router.replace({ pathname: '/ejercicios/rutinas/[routineId]', params: { routineId: newId } });
    } finally {
      setBusy(false);
    }
  }

  function confirmDelete() {
    Alert.alert(
      'Eliminar rutina',
      `¿Seguro que querés eliminar "${routine?.title}"? Esta acción no se puede deshacer.`,
      [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Eliminar', style: 'destructive', onPress: handleDelete },
      ]
    );
  }

  async function handleDelete() {
    setBusy(true);
    try {
      await deleteRoutine(routineId);
      router.replace('/ejercicios/rutinas');
    } catch (e) {
      setBusy(false);
      Alert.alert('Error', e instanceof Error ? e.message : 'No pudimos eliminar la rutina.');
    }
  }

  if (loading) {
    return (
      <View style={[styles.center, { backgroundColor: colors.background }]}>
        <ActivityIndicator color={colors.primary} />
      </View>
    );
  }

  if (error || !routine) {
    return (
      <View style={[styles.center, { backgroundColor: colors.background }]}>
        <Text style={[styles.error, { color: colors.danger }]}>{error ?? 'Rutina no encontrada.'}</Text>
      </View>
    );
  }

  const addedIds = new Set(routineExercises.map((re) => re.exercise_id));
  const available = library.filter((ex) => !addedIds.has(ex.id));
  const totalMinutes = routineExercises.reduce((sum, re) => sum + (re.duration_minutes ?? 0), 0);

  return (
    <FlatList
      data={routineExercises}
      keyExtractor={(item) => item.id}
      contentContainerStyle={[styles.listContent, { backgroundColor: colors.background }]}
      ListHeaderComponent={
        <View style={styles.headerBlock}>
          <Stack.Screen options={{ title: routine.title }} />
          <View style={styles.titleRow}>
            <Text style={[styles.title, { color: colors.text }]}>{routine.title}</Text>
            <Pressable onPress={toggleFavorite} style={styles.favButton}>
              <Text style={[styles.favIcon, { color: routine.is_favorite ? colors.accent : colors.textMuted }]}>
                {routine.is_favorite ? '★' : '☆'}
              </Text>
            </Pressable>
          </View>
          {totalMinutes > 0 ? (
            <Text style={[styles.duration, { color: colors.textMuted }]}>Duración total: {totalMinutes} min</Text>
          ) : null}
          <AppButton label="Duplicar rutina" variant="secondary" onPress={handleDuplicate} loading={busy} />
          <AppButton label="Eliminar rutina" variant="secondary" onPress={confirmDelete} loading={busy} />
        </View>
      }
      renderItem={({ item, index }) => (
        <View style={[styles.row, { borderBottomColor: colors.border }]}>
          <View style={styles.reorderColumn}>
            <Pressable onPress={() => handleMove(index, -1)} disabled={index === 0} style={styles.arrowButton}>
              <Text style={[styles.arrow, { color: index === 0 ? colors.border : colors.primary }]}>▲</Text>
            </Pressable>
            <Pressable
              onPress={() => handleMove(index, 1)}
              disabled={index === routineExercises.length - 1}
              style={styles.arrowButton}
            >
              <Text
                style={[
                  styles.arrow,
                  { color: index === routineExercises.length - 1 ? colors.border : colors.primary },
                ]}
              >
                ▼
              </Text>
            </Pressable>
          </View>
          <Text style={[styles.rowTitle, { color: colors.text }]}>{item.exercise_title}</Text>
          <Pressable onPress={() => handleRemove(item.id)} style={styles.removeButton}>
            <Text style={[styles.removeLabel, { color: colors.danger }]}>Quitar</Text>
          </Pressable>
        </View>
      )}
      ListFooterComponent={
        <View>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Agregar de tu biblioteca</Text>
          {available.length === 0 ? (
            <Text style={[styles.emptyText, { color: colors.textMuted }]}>
              No hay más ejercicios para agregar. Cargá más desde Ejercicios.
            </Text>
          ) : (
            available.map((ex) => (
              <Pressable
                key={ex.id}
                onPress={() => handleAdd(ex.id)}
                disabled={busy}
                style={[styles.row, { borderBottomColor: colors.border }]}
              >
                <Text style={[styles.rowTitle, { color: colors.text }]}>{ex.title}</Text>
                <Text style={[styles.addLabel, { color: colors.link }]}>+ Agregar</Text>
              </Pressable>
            ))
          )}
        </View>
      }
    />
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  listContent: { flexGrow: 1, padding: spacing.lg },
  headerBlock: { gap: spacing.sm, marginBottom: spacing.md },
  titleRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  title: { fontSize: typography.screenTitle, fontFamily: fonts.bold, flex: 1 },
  favButton: { minWidth: 48, minHeight: 48, alignItems: 'center', justifyContent: 'center' },
  favIcon: { fontSize: 24 },
  duration: { fontSize: typography.caption, fontFamily: fonts.regular },
  sectionTitle: { fontSize: typography.sectionTitle, fontFamily: fonts.bold, marginTop: spacing.lg, marginBottom: spacing.sm },
  emptyText: { fontSize: typography.body, fontFamily: fonts.regular },
  row: {
    minHeight: minTouchSize,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    borderBottomWidth: 1,
    paddingVertical: spacing.sm,
  },
  reorderColumn: { gap: 2 },
  arrowButton: { minWidth: 32, minHeight: 24, alignItems: 'center', justifyContent: 'center' },
  arrow: { fontSize: 14 },
  rowTitle: { fontSize: typography.body, fontFamily: fonts.bold, flex: 1 },
  removeButton: { minHeight: minTouchSize, justifyContent: 'center', paddingLeft: spacing.sm },
  removeLabel: { fontSize: typography.caption, fontFamily: fonts.bold },
  addLabel: { fontSize: typography.caption, fontFamily: fonts.bold },
  error: { fontSize: typography.body, fontFamily: fonts.regular, textAlign: 'center', padding: spacing.lg },
});
