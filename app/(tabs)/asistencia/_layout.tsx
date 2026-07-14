import { Stack } from 'expo-router';

import { ThemeToggleButton } from '../../../src/components/ThemeToggleButton';
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
        headerRight: () => <ThemeToggleButton />,
      }}
    >
      <Stack.Screen name="index" options={{ title: 'Asistencia' }} />
      <Stack.Screen name="porcentaje" options={{ title: '% de asistencia' }} />
      <Stack.Screen name="[sessionId]" options={{ title: 'Tomar asistencia' }} />
      <Stack.Screen name="rutina/[sessionId]" options={{ title: 'Rutina de hoy' }} />
    </Stack>
  );
}
