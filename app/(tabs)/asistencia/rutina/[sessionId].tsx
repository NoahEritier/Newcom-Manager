import { useLocalSearchParams } from 'expo-router';
import { useCallback, useState } from 'react';
import { useFocusEffect } from 'expo-router';
import { ActivityIndicator, FlatList, Pressable, StyleSheet, Text, View } from 'react-native';

import {
  addExerciseToRoutine,
  getOrCreateRoutine,
  listRoutineExercises,
  removeRoutineExercise,
  type RoutineExercise,
} from '../../../../src/db/supabase/routines';
import { listExercises, type Exercise } from '../../../../src/db/supabase/exercises';
import { useAuth } from '../../../../src/hooks/useAuth';
import { fonts, minTouchSize, radius, spacing, typography, useTheme } from '../../../../src/theme';

export default function RutinaScreen() {
  const { colors } = useTheme();
  const { sessionId } = useLocalSearchParams<{ sessionId: string }>();
  const { session } = useAuth();
  const coachId = session?.user.id ?? null;

  const [routineId, setRoutineId] = useState<string | null>(null);
  const [routineExercises, setRoutineExercises] = useState<RoutineExercise[]>([]);
  const [library, setLibrary] = useState<Exercise[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!coachId) return;
    setLoading(true);
    setError(null);
    try {
      const [id, allExercises] = await Promise.all([
        getOrCreateRoutine(sessionId),
        listExercises(coachId),
      ]);
      setRoutineId(id);
      setLibrary(allExercises);
      setRoutineExercises(await listRoutineExercises(id));
    } catch (e) {
      setError(
        e instanceof Error
          ? e.message
          : 'No pudimos cargar la rutina. Si tomaste la asistencia offline, sincronizá primero.'
      );
    } finally {
      setLoading(false);
    }
  }, [sessionId, coachId]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  async function handleAdd(exerciseId: string) {
    if (!routineId) return;
    setBusyId(exerciseId);
    try {
      await addExerciseToRoutine(routineId, exerciseId, routineExercises.length);
      setRoutineExercises(await listRoutineExercises(routineId));
    } finally {
      setBusyId(null);
    }
  }

  async function handleRemove(routineExerciseId: string) {
    if (!routineId) return;
    setBusyId(routineExerciseId);
    try {
      await removeRoutineExercise(routineExerciseId);
      setRoutineExercises(await listRoutineExercises(routineId));
    } finally {
      setBusyId(null);
    }
  }

  if (loading) {
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

  const addedIds = new Set(routineExercises.map((re) => re.exercise_id));
  const available = library.filter((ex) => !addedIds.has(ex.id));

  return (
    <FlatList
      data={routineExercises}
      keyExtractor={(item) => item.id}
      contentContainerStyle={[styles.listContent, { backgroundColor: colors.background }]}
      ListHeaderComponent={
        <Text style={[styles.sectionTitle, { color: colors.text }]}>Rutina de hoy</Text>
      }
      ListEmptyComponent={
        <Text style={[styles.emptyText, { color: colors.textMuted }]}>
          Todavía no agregaste ejercicios a esta rutina.
        </Text>
      }
      renderItem={({ item }) => (
        <View style={[styles.row, { borderBottomColor: colors.border }]}>
          <Text style={[styles.rowTitle, { color: colors.text }]}>{item.exercise_title}</Text>
          <Pressable
            onPress={() => handleRemove(item.id)}
            disabled={busyId === item.id}
            style={styles.removeButton}
          >
            <Text style={[styles.removeLabel, { color: colors.danger }]}>Quitar</Text>
          </Pressable>
        </View>
      )}
      ListFooterComponent={
        <View>
          <Text style={[styles.sectionTitle, { color: colors.text, marginTop: spacing.lg }]}>
            Agregar de tu biblioteca
          </Text>
          {available.length === 0 ? (
            <Text style={[styles.emptyText, { color: colors.textMuted }]}>
              No hay más ejercicios para agregar. Cargá más desde la tab Ejercicios.
            </Text>
          ) : (
            available.map((ex) => (
              <Pressable
                key={ex.id}
                onPress={() => handleAdd(ex.id)}
                disabled={busyId === ex.id}
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
  sectionTitle: { fontSize: typography.sectionTitle, fontFamily: fonts.bold, marginBottom: spacing.sm },
  emptyText: { fontSize: typography.body, fontFamily: fonts.regular },
  row: {
    minHeight: minTouchSize,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    paddingVertical: spacing.sm,
  },
  rowTitle: { fontSize: typography.body, fontFamily: fonts.bold, flex: 1 },
  removeButton: { minHeight: minTouchSize, justifyContent: 'center', paddingLeft: spacing.md },
  removeLabel: { fontSize: typography.caption, fontFamily: fonts.bold },
  addLabel: { fontSize: typography.caption, fontFamily: fonts.bold },
  error: { fontSize: typography.body, fontFamily: fonts.regular, textAlign: 'center', padding: spacing.lg },
});
