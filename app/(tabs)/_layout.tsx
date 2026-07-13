import { Ionicons } from '@expo/vector-icons';
import { Redirect, Tabs } from 'expo-router';
import type { ColorValue } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useAuth } from '../../src/hooks/useAuth';
import { TeamProvider } from '../../src/hooks/useTeam';
import { colors, typography } from '../../src/theme';

type IconName = keyof typeof Ionicons.glyphMap;

function TabIcon({
  focused,
  color,
  outline,
  filled,
}: {
  focused: boolean;
  color: ColorValue;
  outline: IconName;
  filled: IconName;
}) {
  return <Ionicons name={focused ? filled : outline} size={26} color={color} />;
}

export default function TabsLayout() {
  const { session, isLoading } = useAuth();
  const insets = useSafeAreaInsets();

  if (isLoading) return null;
  if (!session) return <Redirect href="/login" />;

  return (
    <TeamProvider>
      <Tabs
        screenOptions={{
          headerTitleStyle: { fontSize: typography.title },
          tabBarActiveTintColor: colors.primary,
          tabBarInactiveTintColor: colors.textMuted,
          tabBarLabelStyle: { fontSize: typography.label, fontWeight: '600' },
          tabBarStyle: {
            height: 60 + insets.bottom,
            paddingTop: 8,
            paddingBottom: Math.max(insets.bottom, 8),
          },
        }}
      >
        <Tabs.Screen
          name="asistencia"
          options={{
            title: 'Asistencia',
            headerShown: false,
            tabBarIcon: ({ focused, color }) => (
              <TabIcon focused={focused} color={color} outline="clipboard-outline" filled="clipboard" />
            ),
          }}
        />
        <Tabs.Screen
          name="equipo"
          options={{
            title: 'Equipo',
            headerShown: false,
            tabBarIcon: ({ focused, color }) => (
              <TabIcon focused={focused} color={color} outline="people-outline" filled="people" />
            ),
          }}
        />
        <Tabs.Screen
          name="ejercicios/index"
          options={{
            title: 'Ejercicios',
            tabBarIcon: ({ focused, color }) => (
              <TabIcon focused={focused} color={color} outline="barbell-outline" filled="barbell" />
            ),
          }}
        />
        <Tabs.Screen
          name="torneos/index"
          options={{
            title: 'Torneos',
            tabBarIcon: ({ focused, color }) => (
              <TabIcon focused={focused} color={color} outline="trophy-outline" filled="trophy" />
            ),
          }}
        />
      </Tabs>
    </TeamProvider>
  );
}
