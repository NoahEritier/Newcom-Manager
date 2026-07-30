import type { ReactNode } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { fonts, spacing, typography, useTheme } from '../theme';

type RowProps = {
  label: string;
  value: string | null | undefined;
};

// Fila de solo lectura label/valor. Si no hay valor, no se muestra nada —
// menos ruido visual que mostrar campos vacíos con "—" en cada uno.
export function DetailRow({ label, value }: RowProps) {
  const { colors } = useTheme();
  if (!value) return null;
  return (
    <View style={styles.row}>
      <Text style={[styles.rowLabel, { color: colors.textMuted }]}>{label}</Text>
      <Text style={[styles.rowValue, { color: colors.text }]}>{value}</Text>
    </View>
  );
}

type SectionProps = {
  title?: string;
  children: ReactNode;
};

export function DetailSection({ title, children }: SectionProps) {
  const { colors } = useTheme();
  return (
    <View style={styles.section}>
      {title ? <Text style={[styles.sectionTitle, { color: colors.text }]}>{title}</Text> : null}
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  section: { gap: spacing.xs, marginBottom: spacing.md },
  sectionTitle: {
    fontSize: typography.sectionTitle,
    fontFamily: fonts.bold,
    marginBottom: spacing.xs,
  },
  row: { paddingVertical: spacing.xs },
  rowLabel: { fontSize: typography.caption, fontFamily: fonts.bold },
  rowValue: { fontSize: typography.body, fontFamily: fonts.regular, marginTop: 2 },
});
