import { Stack, router, useLocalSearchParams } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Linking, ScrollView, StyleSheet, Text, View } from 'react-native';

import { AppButton } from '../../../src/components/AppButton';
import { DetailRow, DetailSection } from '../../../src/components/DetailView';
import { ExerciseForm } from '../../../src/components/ExerciseForm';
import {
  deleteExercise,
  getExercise,
  listExerciseVariants,
  replaceExerciseVariants,
  updateExercise,
  type Exercise,
  type ExerciseInput,
  type ExerciseVariant,
  type ExerciseVariantInput,
} from '../../../src/db/supabase/exercises';
import { fonts, spacing, typography, useTheme } from '../../../src/theme';
import { categoryLabel } from '../../../src/utils/exerciseCategories';
import { muscleGroupLabel } from '../../../src/utils/muscleGroups';

function durationSummary(entity: {
  duration_mode: 'duracion' | 'repeticiones' | null;
  duration_minutes: number | null;
  reps: number | null;
  sets: number | null;
}): string | null {
  if (entity.duration_mode === 'duracion' && entity.duration_minutes != null) {
    return `${entity.duration_minutes} min`;
  }
  if (entity.duration_mode === 'repeticiones' && (entity.reps != null || entity.sets != null)) {
    const parts = [];
    if (entity.reps != null) parts.push(`${entity.reps} repeticiones`);
    if (entity.sets != null) parts.push(`${entity.sets} series`);
    return parts.join(' · ');
  }
  return null;
}

export default function EditarEjercicioScreen() {
  const { colors } = useTheme();
  const { exerciseId } = useLocalSearchParams<{ exerciseId: string }>();
  const [exercise, setExercise] = useState<Exercise | null>(null);
  const [variants, setVariants] = useState<ExerciseVariant[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [editing, setEditing] = useState(false);

  const load = useCallback(async () => {
    try {
      const [ex, exerciseVariants] = await Promise.all([
        getExercise(exerciseId),
        listExerciseVariants(exerciseId),
      ]);
      setExercise(ex);
      setVariants(exerciseVariants);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'No pudimos cargar el ejercicio.');
    } finally {
      setLoading(false);
    }
  }, [exerciseId]);

  useEffect(() => {
    load();
  }, [load]);

  async function handleSubmit(input: ExerciseInput, nextVariants: ExerciseVariantInput[]) {
    await updateExercise(exerciseId, input);
    await replaceExerciseVariants(exerciseId, nextVariants);
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
            duration_mode: exercise.duration_mode,
            reps: exercise.reps,
            sets: exercise.sets,
            materials: exercise.materials,
            muscle_groups: exercise.muscle_groups,
          }}
          initialVariants={variants.map((v) => ({
            position: v.position,
            description: v.description,
            materials: v.materials,
            load_text: v.load_text,
            duration_mode: v.duration_mode,
            duration_minutes: v.duration_minutes,
            reps: v.reps,
            sets: v.sets,
          }))}
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
          <DetailRow label="Cómo se mide" value={durationSummary(exercise)} />
          <DetailRow label="Materiales" value={exercise.materials} />
          <DetailRow label="Descripción" value={exercise.description} />
        </DetailSection>

        {variants.length > 0 ? (
          <>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Variaciones</Text>
            {variants.map((variant) => (
              <View key={variant.id} style={[styles.variantCard, { borderColor: colors.border }]}>
                <Text style={[styles.variantTitle, { color: colors.text }]}>Variación {variant.position}</Text>
                <DetailSection>
                  <DetailRow label="Descripción" value={variant.description} />
                  <DetailRow label="Materiales" value={variant.materials} />
                  <DetailRow label="Carga" value={variant.load_text} />
                  <DetailRow label="Cómo se mide" value={durationSummary(variant)} />
                </DetailSection>
              </View>
            ))}
          </>
        ) : null}

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
  sectionTitle: { fontSize: typography.sectionTitle, fontFamily: fonts.bold, marginTop: spacing.md },
  variantCard: { borderWidth: 1, borderRadius: 8, padding: spacing.sm, gap: 2 },
  variantTitle: { fontSize: typography.body, fontFamily: fonts.bold },
  actions: { gap: spacing.sm, marginTop: spacing.md, marginBottom: spacing.xl },
  actionsContainer: { padding: spacing.lg, paddingTop: 0 },
});
