import { MaterialIcons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { Pressable } from 'react-native';

import { minTouchSize, useTheme } from '../theme';

export function AnotadorButton() {
  const { colors } = useTheme();

  return (
    <Pressable
      onPress={() => router.push('/torneos/anotador')}
      hitSlop={8}
      style={{
        minWidth: minTouchSize,
        minHeight: minTouchSize,
        alignItems: 'center',
        justifyContent: 'center',
      }}
      accessibilityLabel="Anotador"
    >
      <MaterialIcons name="scoreboard" size={24} color={colors.text} />
    </Pressable>
  );
}
