import { Stack } from 'expo-router';

import { fonts, typography, useTheme } from '../../../src/theme';

export default function AsistenciaLayout() {
  const { colors } = useTheme();
  return (
    <Stack
      screenOptions={{
        headerTitleStyle: { fontSize: typography.sectionTitle, fontFamily: fonts.bold },
        headerStyle: { backgroundColor: colors.background },
        headerTintColor: colors.text,
        contentStyle: { backgroundColor: colors.background },
      }}
    >
      <Stack.Screen name="index" options={{ title: 'Asistencia' }} />
      <Stack.Screen name="[sessionId]" options={{ title: 'Tomar asistencia' }} />
    </Stack>
  );
}
