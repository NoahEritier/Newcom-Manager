import { MaterialIcons } from '@expo/vector-icons';
import { Redirect, Tabs } from 'expo-router';
import type { ColorValue } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useAuth } from '../../src/hooks/useAuth';
import { TeamProvider } from '../../src/hooks/useTeam';
import { fonts, typography, useTheme } from '../../src/theme';

type IconName = keyof typeof MaterialIcons.glyphMap;

// Guía de identidad: iconografía sólida/rellena (Material Icons Filled), un
// solo color por ícono (activo/inactivo vía color, no cambio de forma).
function TabIcon({ name, color }: { name: IconName; color: ColorValue }) {
  return <MaterialIcons name={name} size={26} color={color} />;
}

export default function TabsLayout() {
  const { session, isLoading } = useAuth();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();

  if (isLoading) return null;
  if (!session) return <Redirect href="/login" />;

  return (
    <TeamProvider>
      <Tabs
        screenOptions={{
          headerTitleStyle: { fontSize: typography.sectionTitle, fontFamily: fonts.bold },
          headerStyle: { backgroundColor: colors.background },
          headerTintColor: colors.text,
          tabBarActiveTintColor: colors.primary,
          tabBarInactiveTintColor: colors.textMuted,
          tabBarLabelStyle: { fontSize: typography.caption, fontFamily: fonts.bold },
          tabBarStyle: {
            height: 60 + insets.bottom,
            paddingTop: 8,
            paddingBottom: Math.max(insets.bottom, 8),
            backgroundColor: colors.background,
            borderTopColor: colors.border,
          },
        }}
      >
        <Tabs.Screen
          name="asistencia"
          options={{
            title: 'Asistencia',
            headerShown: false,
            tabBarIcon: ({ color }) => <TabIcon name="how-to-reg" color={color} />,
          }}
        />
        <Tabs.Screen
          name="equipo"
          options={{
            title: 'Equipo',
            headerShown: false,
            tabBarIcon: ({ color }) => <TabIcon name="groups" color={color} />,
          }}
        />
        <Tabs.Screen
          name="ejercicios"
          options={{
            title: 'Ejercicios',
            headerShown: false,
            tabBarIcon: ({ color }) => <TabIcon name="fitness-center" color={color} />,
          }}
        />
        <Tabs.Screen
          name="torneos"
          options={{
            title: 'Torneos',
            headerShown: false,
            tabBarIcon: ({ color }) => <TabIcon name="emoji-events" color={color} />,
          }}
        />
      </Tabs>
    </TeamProvider>
  );
}
