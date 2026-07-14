import { Stack, router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, StyleSheet, Text, View } from 'react-native';

import { AppButton } from '../../../src/components/AppButton';
import { ExerciseForm } from '../../../src/components/ExerciseForm';
import {
  deleteExercise,
  getExercise,
  updateExercise,
  type Exercise,
  type ExerciseInput,
} from '../../../src/db/supabase/exercises';
import { fonts, spacing, typography, useTheme } from '../../../src/theme';

export default function EditarEjercicioScreen() {
  const { colors } = useTheme();
  const { exerciseId } = useLocalSearchParams<{ exerciseId: string }>();
  const [exercise, setExercise] = useState<Exercise | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    getExercise(exerciseId)
      .then(setExercise)
      .catch((e) => setError(e instanceof Error ? e.message : 'No pudimos cargar el ejercicio.'))
      .finally(() => setLoading(false));
  }, [exerciseId]);

  async function handleSubmit(input: ExerciseInput) {
    await updateExercise(exerciseId, input);
    router.back();
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
        }}
      />
      <View style={styles.deleteContainer}>
        <AppButton
          label="Eliminar ejercicio"
          variant="secondary"
          onPress={confirmDelete}
          loading={deleting}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  error: { fontSize: typography.body, fontFamily: fonts.regular, textAlign: 'center', padding: spacing.lg },
  deleteContainer: { padding: spacing.lg, paddingTop: 0 },
});
