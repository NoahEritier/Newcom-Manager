import { MaterialIcons } from '@expo/vector-icons';
import { Pressable } from 'react-native';

import { useThemeMode } from '../hooks/useThemePreference';
import { minTouchSize, useTheme } from '../theme';

export function ThemeToggleButton() {
  const { colors } = useTheme();
  const { mode, setMode } = useThemeMode();
  const isDark = mode === 'dark';

  return (
    <Pressable
      onPress={() => setMode(isDark ? 'light' : 'dark')}
      hitSlop={8}
      style={{
        minWidth: minTouchSize,
        minHeight: minTouchSize,
        alignItems: 'center',
        justifyContent: 'center',
      }}
      accessibilityLabel={isDark ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'}
    >
      <MaterialIcons name={isDark ? 'light-mode' : 'dark-mode'} size={24} color={colors.text} />
    </Pressable>
  );
}
