import { Stack } from 'expo-router';

import { HeaderActions } from '../../../src/components/HeaderActions';
import { fonts, typography, useTheme } from '../../../src/theme';

export default function EquipoLayout() {
  const { colors } = useTheme();
  return (
    <Stack
      screenOptions={{
        headerTitleStyle: { fontSize: typography.sectionTitle, fontFamily: fonts.bold },
        headerStyle: { backgroundColor: colors.background },
        headerTintColor: colors.text,
        contentStyle: { backgroundColor: colors.background },
        headerRight: () => <HeaderActions />,
      }}
    >
      <Stack.Screen name="index" options={{ title: 'Equipo' }} />
      <Stack.Screen name="datos" options={{ title: 'Datos del equipo' }} />
      <Stack.Screen name="nuevo" options={{ title: 'Nuevo jugador' }} />
      <Stack.Screen name="[playerId]" options={{ title: 'Jugador' }} />
    </Stack>
  );
}
