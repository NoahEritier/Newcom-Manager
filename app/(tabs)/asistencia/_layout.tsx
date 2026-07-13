import { Stack } from 'expo-router';

import { colors, typography } from '../../../src/theme';

export default function AsistenciaLayout() {
  return (
    <Stack
      screenOptions={{
        headerTitleStyle: { fontSize: typography.title },
        headerTintColor: colors.text,
        contentStyle: { backgroundColor: colors.background },
      }}
    >
      <Stack.Screen name="index" options={{ title: 'Asistencia' }} />
      <Stack.Screen name="[sessionId]" options={{ title: 'Tomar asistencia' }} />
    </Stack>
  );
}
