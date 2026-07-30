import { useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

import type { PlayerMatchStatsCounts } from '../db/supabase/matchStats';
import type { ScannedStatRow } from '../db/supabase/statScan';
import { fonts, spacing, typography, useTheme } from '../theme';
import { STAT_FIELDS, type StatFieldKey } from '../utils/statFields';
import { AppButton } from './AppButton';
import { AppTextInput } from './AppTextInput';

type Props = {
  // Valores reconocidos por el escaneo (o null si se está cargando a mano /
  // corrigiendo datos ya confirmados) — siempre editables, nunca se guardan
  // directo.
  recognized: Record<StatFieldKey, ScannedStatRow> | null;
  initialCounts?: PlayerMatchStatsCounts;
  onConfirm: (counts: PlayerMatchStatsCounts) => Promise<void>;
  confirmLabel: string;
};

export function StatReviewForm({ recognized, initialCounts, onConfirm, confirmLabel }: Props) {
  const { colors } = useTheme();
  const [values, setValues] = useState<Record<StatFieldKey, string>>(() => {
    const initial = {} as Record<StatFieldKey, string>;
    for (const field of STAT_FIELDS) {
      const fromScan = recognized?.[field.key]?.recognizedValue;
      const fromCounts = initialCounts?.[field.key];
      const value = fromScan ?? fromCounts ?? 0;
      initial[field.key] = String(value);
    }
    return initial;
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function setFieldValue(key: StatFieldKey, text: string) {
    setValues((prev) => ({ ...prev, [key]: text.replace(/[^0-9]/g, '') }));
  }

  async function handleConfirm() {
    setError(null);
    setSaving(true);
    try {
      const counts = {} as PlayerMatchStatsCounts;
      for (const field of STAT_FIELDS) {
        const parsed = parseInt(values[field.key], 10);
        counts[field.key] = Number.isFinite(parsed) ? parsed : 0;
      }
      await onConfirm(counts);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'No pudimos guardar. Probá de nuevo.');
    } finally {
      setSaving(false);
    }
  }

  let currentSection: string | null = null;

  return (
    <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
      {recognized ? (
        <Text style={[styles.notice, { color: colors.textMuted }]}>
          Estos valores vienen del escaneo automático — revisalos y corregí lo que haga falta antes de
          confirmar.
        </Text>
      ) : null}

      {STAT_FIELDS.map((field) => {
        const showSection = field.section !== currentSection;
        currentSection = field.section;
        const ambiguous = recognized?.[field.key]?.ambiguous ?? false;
        return (
          <View key={field.key}>
            {showSection ? (
              <Text style={[styles.sectionTitle, { color: colors.text }]}>{field.section}</Text>
            ) : null}
            <View style={styles.row}>
              <Text style={[styles.label, { color: colors.textMuted }]}>{field.label}</Text>
              <AppTextInput
                value={values[field.key]}
                onChangeText={(text) => setFieldValue(field.key, text)}
                keyboardType="number-pad"
                style={[
                  styles.input,
                  ambiguous && { borderColor: colors.danger, borderWidth: 2 },
                ]}
              />
            </View>
            {ambiguous ? (
              <Text style={[styles.ambiguousText, { color: colors.danger }]}>
                No pudimos leer este dato con confianza — completalo a mano.
              </Text>
            ) : null}
          </View>
        );
      })}

      {error ? <Text style={[styles.error, { color: colors.danger }]}>{error}</Text> : null}

      <View style={styles.spacer} />
      <AppButton label={confirmLabel} onPress={handleConfirm} loading={saving} disabled={saving} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: spacing.lg },
  notice: {
    fontSize: typography.caption,
    fontFamily: fonts.regular,
    fontStyle: 'italic',
    marginBottom: spacing.md,
  },
  sectionTitle: {
    fontSize: typography.sectionTitle,
    fontFamily: fonts.bold,
    marginTop: spacing.lg,
    marginBottom: spacing.xs,
  },
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, marginTop: spacing.xs },
  label: { flex: 1, fontSize: typography.body, fontFamily: fonts.regular },
  input: { width: 90, textAlign: 'center' },
  ambiguousText: { fontSize: typography.caption, fontFamily: fonts.regular, marginTop: 2 },
  error: { fontSize: typography.caption, fontFamily: fonts.regular, marginTop: spacing.md },
  spacer: { height: spacing.md },
});
