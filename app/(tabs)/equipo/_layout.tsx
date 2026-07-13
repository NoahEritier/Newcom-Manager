import { Stack } from 'expo-router';

import { colors, typography } from '../../../src/theme';

export default function EquipoLayout() {
  return (
    <Stack
      screenOptions={{
        headerTitleStyle: { fontSize: typography.title },
        headerTintColor: colors.text,
        contentStyle: { backgroundColor: colors.background },
      }}
    >
      <Stack.Screen name="index" options={{ title: 'Equipo' }} />
      <Stack.Screen name="nuevo" options={{ title: 'Nuevo jugador' }} />
      <Stack.Screen name="[playerId]" options={{ title: 'Jugador' }} />
    </Stack>
  );
}
