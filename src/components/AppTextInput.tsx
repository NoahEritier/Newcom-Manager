import { StyleSheet, TextInput, type TextInputProps } from 'react-native';

import { fonts, minTouchSize, radius, spacing, typography, useTheme } from '../theme';

export function AppTextInput({ style, ...props }: TextInputProps) {
  const { colors } = useTheme();
  return (
    <TextInput
      placeholderTextColor={colors.textMuted}
      style={[
        styles.input,
        { borderColor: colors.border, color: colors.text, backgroundColor: colors.background },
        style,
      ]}
      {...props}
    />
  );
}

const styles = StyleSheet.create({
  input: {
    minHeight: minTouchSize,
    borderWidth: 1,
    borderRadius: radius,
    paddingHorizontal: spacing.md,
    fontSize: typography.body,
    fontFamily: fonts.regular,
  },
});
