import { StyleSheet, Text } from 'react-native';

import { fonts, spacing, useTheme } from '../theme';

type Tone = 'default' | 'success' | 'danger';

type Props = {
  label: string;
  tone?: Tone;
};

export function StatusBadge({ label, tone = 'default' }: Props) {
  const { colors } = useTheme();
  const color = tone === 'success' ? colors.success : tone === 'danger' ? colors.danger : colors.textMuted;
  return <Text style={[styles.badge, { color, borderColor: color }]}>{label}</Text>;
}

const styles = StyleSheet.create({
  badge: {
    fontSize: 12,
    fontFamily: fonts.bold,
    borderWidth: 1,
    borderRadius: 6,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    alignSelf: 'flex-start',
  },
});
