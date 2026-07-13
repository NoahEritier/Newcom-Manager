import { useState } from 'react';
import { ScrollView, StyleSheet, Text } from 'react-native';

import type { ExerciseInput } from '../db/supabase/exercises';
import { fonts, spacing, typography, useTheme } from '../theme';
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
      await onSubmit({
        title: trimmedTitle,
        description: description.trim() || null,
        media_url: mediaUrl.trim() || null,
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

      <Text style={[styles.label, { color: colors.textMuted }]}>Descripción</Text>
      <AppTextInput
        value={description}
        onChangeText={setDescription}
        placeholder="Cómo se hace, materiales, variantes..."
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
  notesInput: { minHeight: 96, paddingVertical: spacing.sm, textAlignVertical: 'top' },
  error: { fontSize: typography.caption, fontFamily: fonts.regular, marginTop: spacing.md },
  spacer: { height: spacing.md },
});
