import { useState } from 'react';
import { ScrollView, StyleSheet, Text } from 'react-native';

import type { TeamGender, TeamInput } from '../db/supabase/team';
import { fonts, spacing, typography, useTheme } from '../theme';
import { AppButton } from './AppButton';
import { AppTextInput } from './AppTextInput';
import { Dropdown } from './Dropdown';
import { MultiSelectDropdown } from './MultiSelectDropdown';

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

const DAY_FULL_LABEL: Record<number, string> = {
  0: 'Domingo',
  1: 'Lunes',
  2: 'Martes',
  3: 'Miércoles',
  4: 'Jueves',
  5: 'Viernes',
  6: 'Sábado',
};

export function TeamForm({ initialValue, onSubmit }: Props) {
  const { colors } = useTheme();
  const [name, setName] = useState(initialValue.name);
  const [gender, setGender] = useState<TeamGender | null>(initialValue.gender);
  const [category, setCategory] = useState(initialValue.category ?? '');
  const [defaultLocation, setDefaultLocation] = useState(initialValue.default_location ?? '');
  const [trainingDays, setTrainingDays] = useState<number[]>(initialValue.training_days);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
      <Dropdown
        value={gender ?? ''}
        options={[{ value: '', label: 'Sin especificar' }, ...GENDER_OPTIONS]}
        onChange={(v) => setGender((v || null) as TeamGender | null)}
        placeholder="Sin especificar"
        title="Género"
      />

      <Text style={[styles.label, { color: colors.textMuted }]}>Categoría</Text>
      <AppTextInput value={category} onChangeText={setCategory} placeholder="Ej: Sub-14, Mayores" />

      <Text style={[styles.label, { color: colors.textMuted }]}>Lugar de entrenamiento habitual</Text>
      <AppTextInput
        value={defaultLocation}
        onChangeText={setDefaultLocation}
        placeholder="Cancha / dirección"
      />

      <Text style={[styles.label, { color: colors.textMuted }]}>Días de entrenamiento</Text>
      <MultiSelectDropdown
        values={trainingDays.map(String)}
        options={DAY_OPTIONS.map((d) => ({ value: String(d.value), label: DAY_FULL_LABEL[d.value] }))}
        onChange={(values) => setTrainingDays(values.map(Number).sort())}
        placeholder="Seleccionar días"
        title="Días de entrenamiento"
      />

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
  error: { fontSize: typography.caption, fontFamily: fonts.regular, marginTop: spacing.md },
  spacer: { height: spacing.md },
});
