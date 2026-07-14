import { Stack } from 'expo-router';
import { View } from 'react-native';

import { AnotadorButton } from '../../../src/components/AnotadorButton';
import { HeaderActions } from '../../../src/components/HeaderActions';
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
        headerRight: () => <HeaderActions />,
      }}
    >
      <Stack.Screen
        name="index"
        options={{
          title: 'Torneos',
          headerRight: () => (
            <View style={{ flexDirection: 'row' }}>
              <AnotadorButton />
              <HeaderActions />
            </View>
          ),
        }}
      />
      <Stack.Screen name="nuevo" options={{ title: 'Nuevo torneo' }} />
      <Stack.Screen name="[tournamentId]" options={{ title: 'Torneo' }} />
      <Stack.Screen name="partidos" options={{ title: 'Partidos sueltos' }} />
      <Stack.Screen name="partido/nuevo" options={{ title: 'Nuevo partido' }} />
      <Stack.Screen name="partido/[matchId]" options={{ title: 'Partido' }} />
      <Stack.Screen name="anotador" options={{ title: 'Anotador' }} />
    </Stack>
  );
}
