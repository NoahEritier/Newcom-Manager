import { Pressable, StyleSheet, Text, View } from 'react-native';

import { fonts, minTouchSize, radius, spacing, typography, useTheme } from '../theme';

type Props = {
  value: boolean;
  onChange: (value: boolean) => void;
  yesLabel?: string;
  noLabel?: string;
};

export function YesNoPills({ value, onChange, yesLabel = 'Sí', noLabel = 'No' }: Props) {
  const { colors } = useTheme();
  return (
    <View style={styles.pillRow}>
      <Pressable
        onPress={() => onChange(true)}
        style={[
          styles.pill,
          { borderColor: colors.border, backgroundColor: colors.surface },
          value && { backgroundColor: colors.primary, borderColor: colors.primary },
        ]}
      >
        <Text style={[styles.pillLabel, { color: value ? colors.primaryText : colors.text }]}>
          {yesLabel}
        </Text>
      </Pressable>
      <Pressable
        onPress={() => onChange(false)}
        style={[
          styles.pill,
          { borderColor: colors.border, backgroundColor: colors.surface },
          !value && { backgroundColor: colors.primary, borderColor: colors.primary },
        ]}
      >
        <Text style={[styles.pillLabel, { color: !value ? colors.primaryText : colors.text }]}>
          {noLabel}
        </Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  pillRow: { flexDirection: 'row', gap: spacing.sm },
  pill: {
    minHeight: minTouchSize,
    paddingHorizontal: spacing.md,
    borderRadius: radius,
    borderWidth: 1,
    justifyContent: 'center',
  },
  pillLabel: { fontSize: typography.caption, fontFamily: fonts.bold },
});
