import { Tabs } from 'expo-router';

import { colors, typography } from '../../src/theme';

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerTitleStyle: { fontSize: typography.title },
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarLabelStyle: { fontSize: typography.label },
        tabBarStyle: { height: 64, paddingTop: 6 },
      }}
    >
      <Tabs.Screen name="asistencia/index" options={{ title: 'Asistencia' }} />
      <Tabs.Screen name="equipo/index" options={{ title: 'Equipo' }} />
      <Tabs.Screen name="ejercicios/index" options={{ title: 'Ejercicios' }} />
      <Tabs.Screen name="torneos/index" options={{ title: 'Torneos' }} />
    </Tabs>
  );
}
