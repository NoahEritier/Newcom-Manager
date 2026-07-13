import { StyleSheet, TextInput, type TextInputProps } from 'react-native';

import { colors, minTouchSize, spacing, typography } from '../theme';

export function AppTextInput(props: TextInputProps) {
  return <TextInput placeholderTextColor={colors.textMuted} style={styles.input} {...props} />;
}

const styles = StyleSheet.create({
  input: {
    minHeight: minTouchSize,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    paddingHorizontal: spacing.md,
    fontSize: typography.body,
    color: colors.text,
    backgroundColor: colors.background,
  },
});
