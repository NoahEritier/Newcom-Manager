import { MaterialIcons } from '@expo/vector-icons';
import { Alert, Pressable } from 'react-native';

import { signOut } from '../db/supabase/auth';
import { minTouchSize, useTheme } from '../theme';

export function SettingsButton() {
  const { colors } = useTheme();

  function handlePress() {
    Alert.alert('Configuración', undefined, [
      { text: 'Cerrar sesión', style: 'destructive', onPress: () => signOut() },
      { text: 'Cancelar', style: 'cancel' },
    ]);
  }

  return (
    <Pressable
      onPress={handlePress}
      hitSlop={8}
      style={{
        minWidth: minTouchSize,
        minHeight: minTouchSize,
        alignItems: 'center',
        justifyContent: 'center',
      }}
      accessibilityLabel="Configuración"
    >
      <MaterialIcons name="settings" size={24} color={colors.text} />
    </Pressable>
  );
}
