import { useEffect, useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import type { RoutineExerciseDetails } from '../db/supabase/routines';
import { fonts, minTouchSize, radius, spacing, typography, useTheme } from '../theme';
import { AppButton } from './AppButton';
import { AppTextInput } from './AppTextInput';

type Props = {
  visible: boolean;
  exerciseTitle: string;
  initialValue: RoutineExerciseDetails;
  saveLabel: string;
  onCancel: () => void;
  onSave: (details: RoutineExerciseDetails) => Promise<void>;
  onRemove?: () => Promise<void>;
};

export function RoutineExerciseModal({
  visible,
  exerciseTitle,
  initialValue,
  saveLabel,
  onCancel,
  onSave,
  onRemove,
}: Props) {
  const { colors } = useTheme();
  const [durationMinutes, setDurationMinutes] = useState('');
  const [notes, setNotes] = useState('');
  const [adaptations, setAdaptations] = useState('');
  const [variants, setVariants] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (visible) {
      setDurationMinutes(initialValue.duration_minutes != null ? String(initialValue.duration_minutes) : '');
      setNotes(initialValue.notes ?? '');
      setAdaptations(initialValue.adaptations ?? '');
      setVariants(initialValue.variants ?? '');
    }
  }, [visible, initialValue]);

  async function handleSave() {
    setSaving(true);
    try {
      const parsedDuration = parseInt(durationMinutes, 10);
      await onSave({
        duration_minutes: Number.isFinite(parsedDuration) ? parsedDuration : null,
        notes: notes.trim() || null,
        adaptations: adaptations.trim() || null,
        variants: variants.trim() || null,
      });
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onCancel}>
      <View style={styles.overlay}>
        <View style={[styles.card, { backgroundColor: colors.background }]}>
          <ScrollView keyboardShouldPersistTaps="handled">
            <Text style={[styles.title, { color: colors.text }]}>{exerciseTitle}</Text>

            <Text style={[styles.label, { color: colors.textMuted }]}>Duración en esta rutina (minutos)</Text>
            <AppTextInput
              value={durationMinutes}
              onChangeText={setDurationMinutes}
              placeholder="Ej: 10"
              keyboardType="number-pad"
            />

            <Text style={[styles.label, { color: colors.textMuted }]}>Notas</Text>
            <AppTextInput
              value={notes}
              onChangeText={setNotes}
              placeholder="Indicaciones para esta rutina"
              multiline
              numberOfLines={3}
              style={styles.multilineInput}
            />

            <Text style={[styles.label, { color: colors.textMuted }]}>Adaptaciones</Text>
            <AppTextInput
              value={adaptations}
              onChangeText={setAdaptations}
              placeholder="Ajustes puntuales para este grupo"
              multiline
              numberOfLines={3}
              style={styles.multilineInput}
            />

            <Text style={[styles.label, { color: colors.textMuted }]}>Variantes</Text>
            <AppTextInput
              value={variants}
              onChangeText={setVariants}
              placeholder="Variaciones del ejercicio para esta rutina"
              multiline
              numberOfLines={3}
              style={styles.multilineInput}
            />

            <View style={styles.spacer} />
            <AppButton label={saveLabel} onPress={handleSave} loading={saving} disabled={saving} />
            <View style={styles.smallSpacer} />
            <AppButton label="Cancelar" variant="secondary" onPress={onCancel} disabled={saving} />
            {onRemove ? (
              <>
                <View style={styles.smallSpacer} />
                <Pressable style={styles.removeButton} onPress={onRemove} disabled={saving}>
                  <Text style={[styles.removeLabel, { color: colors.danger }]}>Quitar de la rutina</Text>
                </Pressable>
              </>
            ) : null}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    padding: spacing.lg,
  },
  card: {
    borderRadius: radius,
    padding: spacing.lg,
    maxHeight: '85%',
  },
  title: { fontSize: typography.sectionTitle, fontFamily: fonts.bold, marginBottom: spacing.sm },
  label: {
    fontSize: typography.caption,
    fontFamily: fonts.bold,
    marginTop: spacing.md,
    marginBottom: spacing.xs,
  },
  multilineInput: { minHeight: 72, paddingVertical: spacing.sm, textAlignVertical: 'top' },
  spacer: { height: spacing.md },
  smallSpacer: { height: spacing.sm },
  removeButton: { minHeight: minTouchSize, alignItems: 'center', justifyContent: 'center' },
  removeLabel: { fontSize: typography.caption, fontFamily: fonts.bold },
});
