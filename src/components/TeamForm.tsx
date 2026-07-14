import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import type { TeamGender, TeamInput } from '../db/supabase/team';
import { fonts, minTouchSize, radius, spacing, typography, useTheme } from '../theme';
import { AppButton } from './AppButton';
import { AppTextInput } from './AppTextInput';

type Props = {
  initialValue: TeamInput;
  onSubmit: (input: TeamInput) => Promise<void>;
};

const GENDER_OPTIONS: { value: TeamGender; label: string }[] = [
  { value: 'masculino', label: 'Masculino' },
  { value: 'femenino', label: 'Femenino' },
  { value: 'mixto', label: 'Mixto' },
];

// Orden de la semana empezando el lunes; el valor guardado sigue la
// convención de Date.getDay() en JS (0=domingo .. 6=sábado).
const DAY_OPTIONS = [
  { value: 1, label: 'Lun' },
  { value: 2, label: 'Mar' },
  { value: 3, label: 'Mié' },
  { value: 4, label: 'Jue' },
  { value: 5, label: 'Vie' },
  { value: 6, label: 'Sáb' },
  { value: 0, label: 'Dom' },
];

export function TeamForm({ initialValue, onSubmit }: Props) {
  const { colors } = useTheme();
  const [name, setName] = useState(initialValue.name);
  const [gender, setGender] = useState<TeamGender | null>(initialValue.gender);
  const [category, setCategory] = useState(initialValue.category ?? '');
  const [defaultLocation, setDefaultLocation] = useState(initialValue.default_location ?? '');
  const [trainingDays, setTrainingDays] = useState<number[]>(initialValue.training_days);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function toggleDay(day: number) {
    setTrainingDays((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day].sort()
    );
  }

  async function handleSubmit() {
    const trimmedName = name.trim();
    if (!trimmedName) {
      setError('El nombre del equipo es obligatorio.');
      return;
    }
    setError(null);
    setLoading(true);
    try {
      await onSubmit({
        name: trimmedName,
        gender,
        category: category.trim() || null,
        default_location: defaultLocation.trim() || null,
        training_days: trainingDays,
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
      <Text style={[styles.label, { color: colors.textMuted }]}>Nombre del equipo</Text>
      <AppTextInput value={name} onChangeText={setName} placeholder="Ej: Newcom Sub-14" />

      <Text style={[styles.label, { color: colors.textMuted }]}>Género</Text>
      <View style={styles.pillRow}>
        {GENDER_OPTIONS.map((option) => {
          const selected = option.value === gender;
          return (
            <Pressable
              key={option.value}
              onPress={() => setGender(selected ? null : option.value)}
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

      <Text style={[styles.label, { color: colors.textMuted }]}>Categoría</Text>
      <AppTextInput value={category} onChangeText={setCategory} placeholder="Ej: Sub-14, Mayores" />

      <Text style={[styles.label, { color: colors.textMuted }]}>Lugar de entrenamiento habitual</Text>
      <AppTextInput
        value={defaultLocation}
        onChangeText={setDefaultLocation}
        placeholder="Cancha / dirección"
      />

      <Text style={[styles.label, { color: colors.textMuted }]}>Días de entrenamiento</Text>
      <View style={styles.pillRow}>
        {DAY_OPTIONS.map((option) => {
          const selected = trainingDays.includes(option.value);
          return (
            <Pressable
              key={option.value}
              onPress={() => toggleDay(option.value)}
              style={[
                styles.dayPill,
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

      {error ? <Text style={[styles.error, { color: colors.danger }]}>{error}</Text> : null}

      <Text style={styles.spacer} />
      <AppButton
        label="Guardar datos del equipo"
        onPress={handleSubmit}
        loading={loading}
        disabled={!name.trim()}
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
  dayPill: {
    minWidth: minTouchSize,
    minHeight: minTouchSize,
    paddingHorizontal: spacing.sm,
    borderRadius: radius,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pillLabel: { fontSize: typography.caption, fontFamily: fonts.bold },
  error: { fontSize: typography.caption, fontFamily: fonts.regular, marginTop: spacing.md },
  spacer: { height: spacing.md },
});
