import { Redirect, Tabs } from 'expo-router';

import { useAuth } from '../../src/hooks/useAuth';
import { TeamProvider } from '../../src/hooks/useTeam';
import { colors, typography } from '../../src/theme';

export default function TabsLayout() {
  const { session, isLoading } = useAuth();

  if (isLoading) return null;
  if (!session) return <Redirect href="/login" />;

  return (
    <TeamProvider>
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
        <Tabs.Screen name="equipo" options={{ title: 'Equipo', headerShown: false }} />
        <Tabs.Screen name="ejercicios/index" options={{ title: 'Ejercicios' }} />
        <Tabs.Screen name="torneos/index" options={{ title: 'Torneos' }} />
      </Tabs>
    </TeamProvider>
  );
}
