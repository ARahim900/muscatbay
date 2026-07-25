/**
 * Tab shell.
 *
 * Five destinations, which is the most a thumb can reach reliably. Module
 * detail lives one level down rather than as extra tabs, so the shell looks the
 * same whichever role is signed in — visibility differences show up inside the
 * Modules list, driven by the shared `ROLE_MODULES` map.
 */
import { Tabs } from 'expo-router';
import { Bell, LayoutGrid, LayoutDashboard, Search, Settings } from 'lucide-react-native';

import { useTheme } from '~/theme/theme-provider';

export default function TabsLayout() {
  const { colors } = useTheme();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.ring,
        tabBarInactiveTintColor: colors.mutedForeground,
        tabBarStyle: {
          backgroundColor: colors.card,
          borderTopColor: colors.border,
        },
        tabBarLabelStyle: { fontFamily: 'Geist_500Medium', fontSize: 11 },
        sceneStyle: { backgroundColor: colors.background },
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Dashboard',
          tabBarIcon: ({ color, size }) => <LayoutDashboard size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="alerts"
        options={{
          title: 'Alerts',
          tabBarIcon: ({ color, size }) => <Bell size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="modules"
        options={{
          title: 'Modules',
          tabBarIcon: ({ color, size }) => <LayoutGrid size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="search"
        options={{
          title: 'Search',
          tabBarIcon: ({ color, size }) => <Search size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: 'Settings',
          tabBarIcon: ({ color, size }) => <Settings size={size} color={color} />,
        }}
      />
    </Tabs>
  );
}
