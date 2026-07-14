import { Stack } from 'expo-router';

import { fonts, typography, useTheme } from '../../../../src/theme';

export default function RutinasLayout() {
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
      <Stack.Screen name="index" options={{ title: 'Rutinas' }} />
      <Stack.Screen name="nueva" options={{ title: 'Nueva rutina' }} />
      <Stack.Screen name="[routineId]" options={{ title: 'Rutina' }} />
    </Stack>
  );
}
