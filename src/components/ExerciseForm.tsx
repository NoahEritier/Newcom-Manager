import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import type {
  DurationMode,
  ExerciseCategory,
  ExerciseInput,
  ExerciseVariantInput,
} from '../db/supabase/exercises';
import { fonts, minTouchSize, radius, spacing, typography, useTheme } from '../theme';
import { EXERCISE_CATEGORIES } from '../utils/exerciseCategories';
import { MUSCLE_GROUPS_JOINTS, MUSCLE_GROUPS_MUSCLES } from '../utils/muscleGroups';
import { AppButton } from './AppButton';
import { AppTextInput } from './AppTextInput';
import { Dropdown } from './Dropdown';
import { MaterialField } from './MaterialField';
import { MultiSelectDropdown } from './MultiSelectDropdown';

const DURATION_MODE_OPTIONS = [
  { value: 'duracion', label: 'Duración (minutos)' },
  { value: 'repeticiones', label: 'Repeticiones y series' },
];

const MAX_VARIANTS = 3;

type DurationFieldsValue = {
  duration_mode: DurationMode | null;
  duration_minutes: number | null;
  reps: number | null;
  sets: number | null;
};

// Campos de duración/repeticiones+series, compartidos entre el ejercicio
// base y cada variación.
function DurationFields({
  value,
  onChange,
}: {
  value: DurationFieldsValue;
  onChange: (value: DurationFieldsValue) => void;
}) {
  const { colors } = useTheme();
  return (
    <View style={{ gap: spacing.xs }}>
      <Dropdown
        value={value.duration_mode}
        options={DURATION_MODE_OPTIONS}
        onChange={(mode) =>
          onChange({ ...value, duration_mode: mode as DurationMode, reps: null, sets: null, duration_minutes: null })
        }
        placeholder="¿Se mide en tiempo o en repeticiones?"
        title="Cómo se mide"
      />
      {value.duration_mode === 'duracion' ? (
        <AppTextInput
          value={value.duration_minutes != null ? String(value.duration_minutes) : ''}
          onChangeText={(text) => {
            const parsed = parseInt(text, 10);
            onChange({ ...value, duration_minutes: Number.isFinite(parsed) ? parsed : null });
          }}
          placeholder="Minutos"
          keyboardType="number-pad"
        />
      ) : value.duration_mode === 'repeticiones' ? (
        <View style={styles.row}>
          <View style={styles.rowField}>
            <Text style={[styles.smallLabel, { color: colors.textMuted }]}>Repeticiones</Text>
            <AppTextInput
              value={value.reps != null ? String(value.reps) : ''}
              onChangeText={(text) => {
                const parsed = parseInt(text, 10);
                onChange({ ...value, reps: Number.isFinite(parsed) ? parsed : null });
              }}
              placeholder="Ej: 12"
              keyboardType="number-pad"
            />
          </View>
          <View style={styles.rowField}>
            <Text style={[styles.smallLabel, { color: colors.textMuted }]}>Series</Text>
            <AppTextInput
              value={value.sets != null ? String(value.sets) : ''}
              onChangeText={(text) => {
                const parsed = parseInt(text, 10);
                onChange({ ...value, sets: Number.isFinite(parsed) ? parsed : null });
              }}
              placeholder="Ej: 3"
              keyboardType="number-pad"
            />
          </View>
        </View>
      ) : null}
    </View>
  );
}

function emptyVariant(position: number): ExerciseVariantInput {
  return {
    position,
    description: null,
    materials: null,
    load_text: null,
    duration_mode: null,
    duration_minutes: null,
    reps: null,
    sets: null,
  };
}

type Props = {
  initialValue?: ExerciseInput;
  initialVariants?: ExerciseVariantInput[];
  onSubmit: (input: ExerciseInput, variants: ExerciseVariantInput[]) => Promise<void>;
  submitLabel: string;
};

export function ExerciseForm({ initialValue, initialVariants, onSubmit, submitLabel }: Props) {
  const { colors } = useTheme();
  const [title, setTitle] = useState(initialValue?.title ?? '');
  const [description, setDescription] = useState(initialValue?.description ?? '');
  const [mediaUrl, setMediaUrl] = useState(initialValue?.media_url ?? '');
  const [category, setCategory] = useState<ExerciseCategory | null>(initialValue?.category ?? null);
  const [durationFields, setDurationFields] = useState<DurationFieldsValue>({
    duration_mode: initialValue?.duration_mode ?? null,
    duration_minutes: initialValue?.duration_minutes ?? null,
    reps: initialValue?.reps ?? null,
    sets: initialValue?.sets ?? null,
  });
  const [materials, setMaterials] = useState<string | null>(initialValue?.materials ?? null);
  const [muscleGroups, setMuscleGroups] = useState<string[]>(initialValue?.muscle_groups ?? []);
  const [variants, setVariants] = useState<ExerciseVariantInput[]>(initialVariants ?? []);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const selectedMuscles = muscleGroups.filter((g) =>
    MUSCLE_GROUPS_MUSCLES.some((m) => m.value === g)
  );
  const selectedJoints = muscleGroups.filter((g) => MUSCLE_GROUPS_JOINTS.some((j) => j.value === g));

  function updateMuscles(values: string[]) {
    setMuscleGroups([...values, ...selectedJoints]);
  }
  function updateJoints(values: string[]) {
    setMuscleGroups([...selectedMuscles, ...values]);
  }

  function addVariant() {
    if (variants.length >= MAX_VARIANTS) return;
    setVariants((prev) => [...prev, emptyVariant(prev.length + 1)]);
  }
  function removeVariant(index: number) {
    setVariants((prev) => prev.filter((_, i) => i !== index).map((v, i) => ({ ...v, position: i + 1 })));
  }
  function updateVariant(index: number, patch: Partial<ExerciseVariantInput>) {
    setVariants((prev) => prev.map((v, i) => (i === index ? { ...v, ...patch } : v)));
  }

  async function handleSubmit() {
    const trimmedTitle = title.trim();
    if (!trimmedTitle) {
      setError('El título es obligatorio.');
      return;
    }
    setError(null);
    setLoading(true);
    try {
      await onSubmit(
        {
          title: trimmedTitle,
          description: description.trim() || null,
          media_url: mediaUrl.trim() || null,
          category,
          duration_minutes: durationFields.duration_minutes,
          duration_mode: durationFields.duration_mode,
          reps: durationFields.reps,
          sets: durationFields.sets,
          materials,
          muscle_groups: muscleGroups,
        },
        variants
      );
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
      <Dropdown
        value={category}
        options={EXERCISE_CATEGORIES}
        onChange={(v) => setCategory(v as ExerciseCategory)}
        placeholder="Seleccionar categoría"
        title="Categoría"
      />

      <Text style={[styles.label, { color: colors.textMuted }]}>¿Cómo se mide? (opcional)</Text>
      <DurationFields value={durationFields} onChange={setDurationFields} />

      <Text style={[styles.label, { color: colors.textMuted }]}>Grupo muscular que trabaja</Text>
      <MultiSelectDropdown
        values={selectedMuscles}
        options={MUSCLE_GROUPS_MUSCLES}
        onChange={updateMuscles}
        placeholder="Seleccionar grupos musculares"
        title="Grupo muscular"
      />

      <Text style={[styles.label, { color: colors.textMuted }]}>Articulación involucrada</Text>
      <MultiSelectDropdown
        values={selectedJoints}
        options={MUSCLE_GROUPS_JOINTS}
        onChange={updateJoints}
        placeholder="Seleccionar articulaciones"
        title="Articulación"
      />

      <Text style={[styles.label, { color: colors.textMuted }]}>Materiales</Text>
      <MaterialField value={materials} onChange={setMaterials} />

      <Text style={[styles.label, { color: colors.textMuted }]}>Descripción</Text>
      <AppTextInput
        value={description}
        onChangeText={setDescription}
        placeholder="Cómo se hace..."
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

      <View style={[styles.variantsSection, { borderTopColor: colors.border }]}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>
          Variaciones (opcional, hasta {MAX_VARIANTS})
        </Text>
        <Text style={[styles.hint, { color: colors.textMuted }]}>
          Otras formas de hacer el mismo ejercicio (más fácil/más difícil, con otro material, etc.).
        </Text>

        {variants.map((variant, index) => (
          <View key={index} style={[styles.variantCard, { borderColor: colors.border, backgroundColor: colors.surface }]}>
            <View style={styles.variantHeader}>
              <Text style={[styles.variantTitle, { color: colors.text }]}>Variación {index + 1}</Text>
              <Pressable onPress={() => removeVariant(index)} hitSlop={8}>
                <Text style={[styles.removeLabel, { color: colors.danger }]}>Quitar</Text>
              </Pressable>
            </View>

            <Text style={[styles.smallLabel, { color: colors.textMuted }]}>Descripción</Text>
            <AppTextInput
              value={variant.description ?? ''}
              onChangeText={(text) => updateVariant(index, { description: text || null })}
              placeholder="En qué cambia respecto al ejercicio base"
              multiline
              numberOfLines={3}
              style={styles.notesInput}
            />

            <Text style={[styles.smallLabel, { color: colors.textMuted }]}>Materiales</Text>
            <MaterialField
              value={variant.materials}
              onChange={(v) => updateVariant(index, { materials: v })}
            />

            <Text style={[styles.smallLabel, { color: colors.textMuted }]}>Carga (opcional)</Text>
            <AppTextInput
              value={variant.load_text ?? ''}
              onChangeText={(text) => updateVariant(index, { load_text: text || null })}
              placeholder="Ej: con mancuernas de 2kg"
            />

            <Text style={[styles.smallLabel, { color: colors.textMuted }]}>¿Cómo se mide?</Text>
            <DurationFields
              value={{
                duration_mode: variant.duration_mode,
                duration_minutes: variant.duration_minutes,
                reps: variant.reps,
                sets: variant.sets,
              }}
              onChange={(next) => updateVariant(index, next)}
            />
          </View>
        ))}

        {variants.length < MAX_VARIANTS ? (
          <AppButton label="+ Agregar variación" variant="secondary" onPress={addVariant} />
        ) : null}
      </View>

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
  smallLabel: {
    fontSize: typography.caption,
    fontFamily: fonts.bold,
    marginTop: spacing.sm,
    marginBottom: spacing.xs,
  },
  row: { flexDirection: 'row', gap: spacing.md },
  rowField: { flex: 1 },
  notesInput: { minHeight: 88, paddingVertical: spacing.sm, textAlignVertical: 'top' },
  error: { fontSize: typography.caption, fontFamily: fonts.regular, marginTop: spacing.md },
  spacer: { height: spacing.md },
  sectionTitle: { fontSize: typography.sectionTitle, fontFamily: fonts.bold, marginBottom: spacing.xs },
  hint: { fontSize: typography.caption, fontFamily: fonts.regular, marginBottom: spacing.md },
  variantsSection: { marginTop: spacing.lg, paddingTop: spacing.lg, borderTopWidth: 1, gap: spacing.md },
  variantCard: { borderWidth: 1, borderRadius: radius, padding: spacing.md, gap: 2 },
  variantHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  variantTitle: { fontSize: typography.body, fontFamily: fonts.bold },
  removeLabel: { fontSize: typography.caption, fontFamily: fonts.bold, minHeight: minTouchSize, textAlignVertical: 'center' },
});
