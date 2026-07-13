import { Stack } from 'expo-router';

import { ThemeToggleButton } from '../../../src/components/ThemeToggleButton';
import { fonts, typography, useTheme } from '../../../src/theme';

export default function TorneosLayout() {
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
      <Stack.Screen name="index" options={{ title: 'Torneos' }} />
      <Stack.Screen name="nuevo" options={{ title: 'Nuevo torneo' }} />
      <Stack.Screen name="[tournamentId]" options={{ title: 'Torneo' }} />
    </Stack>
  );
}
