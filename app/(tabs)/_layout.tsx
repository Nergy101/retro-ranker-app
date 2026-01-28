import { Tabs } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { colors } from '../../theme/colors';

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textTertiary,
        tabBarStyle: {
          backgroundColor: colors.backgroundCard,
          borderTopColor: colors.border,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ color, size, focused }) => (
            <TabBarIcon name="home" color={color} size={size} focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="compare"
        options={{
          title: 'Compare',
          tabBarIcon: ({ color, size, focused }) => (
            <TabBarIcon
              name="compare"
              color={color}
              size={size}
              focused={focused}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ color, size, focused }) => (
            <TabBarIcon
              name="profile"
              color={color}
              size={size}
              focused={focused}
            />
          ),
        }}
      />
    </Tabs>
  );
}

// Simple icon component - can be replaced with react-native-vector-icons later
function TabBarIcon(
  { name, color, size, focused }: { name: 'home' | 'compare' | 'profile'; color: string; size: number; focused: boolean },
) {
  const icons: Record<
    typeof name,
    React.ComponentProps<typeof Feather>['name']
  > = {
    home: 'home',
    compare: 'git-pull-request',
    profile: 'user',
  };

  return (
    <Feather
      name={icons[name]}
      color={color}
      size={size}
      strokeWidth={focused ? 2.5 : 2}
    />
  );
}
