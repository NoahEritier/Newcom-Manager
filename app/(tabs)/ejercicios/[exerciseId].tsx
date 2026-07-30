import { Stack, router, useLocalSearchParams } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Linking, ScrollView, StyleSheet, Text, View } from 'react-native';

import { AppButton } from '../../../src/components/AppButton';
import { DetailRow, DetailSection } from '../../../src/components/DetailView';
import { ExerciseForm } from '../../../src/components/ExerciseForm';
import {
  deleteExercise,
  getExercise,
  updateExercise,
  type Exercise,
  type ExerciseInput,
} from '../../../src/db/supabase/exercises';
import { fonts, spacing, typography, useTheme } from '../../../src/theme';
import { categoryLabel } from '../../../src/utils/exerciseCategories';
import { muscleGroupLabel } from '../../../src/utils/muscleGroups';

export default function EditarEjercicioScreen() {
  const { colors } = useTheme();
  const { exerciseId } = useLocalSearchParams<{ exerciseId: string }>();
  const [exercise, setExercise] = useState<Exercise | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [editing, setEditing] = useState(false);

  const load = useCallback(() => {
    return getExercise(exerciseId)
      .then(setExercise)
      .catch((e) => setError(e instanceof Error ? e.message : 'No pudimos cargar el ejercicio.'))
      .finally(() => setLoading(false));
  }, [exerciseId]);

  useEffect(() => {
    load();
  }, [load]);

  async function handleSubmit(input: ExerciseInput) {
    await updateExercise(exerciseId, input);
    await load();
    setEditing(false);
  }

  function confirmDelete() {
    Alert.alert(
      'Eliminar ejercicio',
      `¿Seguro que querés eliminar "${exercise?.title}"? Esta acción no se puede deshacer.`,
      [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Eliminar', style: 'destructive', onPress: handleDelete },
      ]
    );
  }

  async function handleDelete() {
    setDeleting(true);
    try {
      await deleteExercise(exerciseId);
      router.replace('/ejercicios');
    } catch (e) {
      setDeleting(false);
      Alert.alert('Error', e instanceof Error ? e.message : 'No pudimos eliminar el ejercicio.');
    }
  }

  function handleOpenMedia() {
    if (!exercise?.media_url) return;
    Linking.openURL(exercise.media_url).catch(() =>
      Alert.alert('Error', 'No pudimos abrir ese link. Revisá que esté bien escrito.')
    );
  }

  if (loading) {
    return (
      <View style={[styles.center, { backgroundColor: colors.background }]}>
        <ActivityIndicator color={colors.primary} />
      </View>
    );
  }

  if (error || !exercise) {
    return (
      <View style={[styles.center, { backgroundColor: colors.background }]}>
        <Text style={[styles.error, { color: colors.danger }]}>
          {error ?? 'Ejercicio no encontrado.'}
        </Text>
      </View>
    );
  }

  if (editing) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <Stack.Screen options={{ title: exercise.title }} />
        <ExerciseForm
          submitLabel="Guardar cambios"
          onSubmit={handleSubmit}
          initialValue={{
            title: exercise.title,
            description: exercise.description,
            media_url: exercise.media_url,
            category: exercise.category,
            duration_minutes: exercise.duration_minutes,
            materials: exercise.materials,
            muscle_groups: exercise.muscle_groups,
          }}
        />
        <View style={styles.actionsContainer}>
          <AppButton label="Cancelar" variant="secondary" onPress={() => setEditing(false)} />
        </View>
      </View>
    );
  }

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.background }]}>
      <Stack.Screen options={{ title: exercise.title }} />
      <View style={styles.content}>
        <Text style={[styles.title, { color: colors.text }]}>{exercise.title}</Text>

        <DetailSection>
          <DetailRow label="Categoría" value={categoryLabel(exercise.category)} />
          <DetailRow
            label="Grupo muscular / articulación"
            value={exercise.muscle_groups.length > 0 ? exercise.muscle_groups.map(muscleGroupLabel).join(', ') : null}
          />
          <DetailRow
            label="Duración orientativa"
            value={exercise.duration_minutes ? `${exercise.duration_minutes} min` : null}
          />
          <DetailRow label="Materiales" value={exercise.materials} />
          <DetailRow label="Descripción" value={exercise.description} />
        </DetailSection>

        <View style={styles.actions}>
          <AppButton label="Editar" onPress={() => setEditing(true)} />
          {exercise.media_url ? (
            <AppButton label="Ver imagen o video" variant="secondary" onPress={handleOpenMedia} />
          ) : null}
          <AppButton
            label="Eliminar ejercicio"
            variant="secondary"
            onPress={confirmDelete}
            loading={deleting}
          />
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: spacing.lg, gap: spacing.sm },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  error: { fontSize: typography.body, fontFamily: fonts.regular, textAlign: 'center', padding: spacing.lg },
  title: { fontSize: typography.screenTitle, fontFamily: fonts.bold },
  actions: { gap: spacing.sm, marginTop: spacing.md, marginBottom: spacing.xl },
  actionsContainer: { padding: spacing.lg, paddingTop: 0 },
});
