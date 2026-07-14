import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import type { ExerciseCategory, ExerciseInput } from '../db/supabase/exercises';
import { fonts, minTouchSize, radius, spacing, typography, useTheme } from '../theme';
import { EXERCISE_CATEGORIES } from '../utils/exerciseCategories';
import { AppButton } from './AppButton';
import { AppTextInput } from './AppTextInput';

type Props = {
  initialValue?: ExerciseInput;
  onSubmit: (input: ExerciseInput) => Promise<void>;
  submitLabel: string;
};

export function ExerciseForm({ initialValue, onSubmit, submitLabel }: Props) {
  const { colors } = useTheme();
  const [title, setTitle] = useState(initialValue?.title ?? '');
  const [description, setDescription] = useState(initialValue?.description ?? '');
  const [mediaUrl, setMediaUrl] = useState(initialValue?.media_url ?? '');
  const [category, setCategory] = useState<ExerciseCategory | null>(initialValue?.category ?? null);
  const [durationMinutes, setDurationMinutes] = useState(
    initialValue?.duration_minutes != null ? String(initialValue.duration_minutes) : ''
  );
  const [materials, setMaterials] = useState(initialValue?.materials ?? '');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit() {
    const trimmedTitle = title.trim();
    if (!trimmedTitle) {
      setError('El título es obligatorio.');
      return;
    }
    setError(null);
    setLoading(true);
    try {
      const parsedDuration = parseInt(durationMinutes, 10);
      await onSubmit({
        title: trimmedTitle,
        description: description.trim() || null,
        media_url: mediaUrl.trim() || null,
        category,
        duration_minutes: Number.isFinite(parsedDuration) ? parsedDuration : null,
        materials: materials.trim() || null,
      });
    } catch (e) {
      setError(e instanceof Error ? e.message : 'No pudimos guardar. Probá de nuevo.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <ScrollView
      style={styles.scroll}
      contentContainerStyle={styles.container}
      keyboardShouldPersistTaps="handled"
    >
      <Text style={[styles.label, { color: colors.textMuted }]}>Título</Text>
      <AppTextInput value={title} onChangeText={setTitle} placeholder="Nombre del ejercicio" />

      <Text style={[styles.label, { color: colors.textMuted }]}>Categoría</Text>
      <View style={styles.pillRow}>
        {EXERCISE_CATEGORIES.map((option) => {
          const selected = option.value === category;
          return (
            <Pressable
              key={option.value}
              onPress={() => setCategory(selected ? null : option.value)}
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

      <Text style={[styles.label, { color: colors.textMuted }]}>Duración estimada (minutos)</Text>
      <AppTextInput
        value={durationMinutes}
        onChangeText={setDurationMinutes}
        placeholder="Ej: 15"
        keyboardType="number-pad"
      />

      <Text style={[styles.label, { color: colors.textMuted }]}>Materiales</Text>
      <AppTextInput value={materials} onChangeText={setMaterials} placeholder="Ej: conos, pelotas" />

      <Text style={[styles.label, { color: colors.textMuted }]}>Descripción</Text>
      <AppTextInput
        value={description}
        onChangeText={setDescription}
        placeholder="Cómo se hace, variantes..."
        multiline
        numberOfLines={4}
        style={styles.notesInput}
      />

      <Text style={[styles.label, { color: colors.textMuted }]}>Link de imagen o video (opcional)</Text>
      <AppTextInput
        value={mediaUrl}
        onChangeText={setMediaUrl}
        placeholder="https://..."
        keyboardType="url"
        autoCapitalize="none"
      />

      {error ? <Text style={[styles.error, { color: colors.danger }]}>{error}</Text> : null}

      <Text style={styles.spacer} />
      <AppButton
        label={submitLabel}
        onPress={handleSubmit}
        loading={loading}
        disabled={!title.trim()}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: { flex: 1 },
  container: { padding: spacing.lg },
  label: {
    fontSize: typography.caption,
    fontFamily: fonts.bold,
    marginTop: spacing.md,
    marginBottom: spacing.xs,
  },
  pillRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  pill: {
    minHeight: minTouchSize,
    paddingHorizontal: spacing.md,
    borderRadius: radius,
    borderWidth: 1,
    justifyContent: 'center',
  },
  pillLabel: { fontSize: typography.caption, fontFamily: fonts.bold },
  notesInput: { minHeight: 96, paddingVertical: spacing.sm, textAlignVertical: 'top' },
  error: { fontSize: typography.caption, fontFamily: fonts.regular, marginTop: spacing.md },
  spacer: { height: spacing.md },
});
