import { Tabs } from "expo-router";
import { Feather } from "@expo/vector-icons";
import { Image } from "react-native";
import { useAuth } from "../../contexts/AuthContext";
import { colors } from "../../theme/colors";

const DICEBEAR_PROFILE_URL = "https://api.dicebear.com/9.x/bottts-neutral/png";

export default function TabLayout() {
  const { authenticated, user } = useAuth();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textTertiary,
        tabBarStyle: {
          backgroundColor: colors.backgroundCard,
          borderTopWidth: 1,
          borderTopColor: colors.primary,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Home",
          tabBarIcon: ({ color, size, focused }) => (
            <TabBarIcon
              name="home"
              color={color}
              size={size}
              focused={focused}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="search"
        options={{
          title: "Search",
          tabBarIcon: ({ color, size, focused }) => (
            <TabBarIcon
              name="search"
              color={color}
              size={size}
              focused={focused}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="compare"
        options={{
          title: "Compare",
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
        name="charts"
        options={{
          title: "Charts",
          tabBarIcon: ({ color, size, focused }) => (
            <TabBarIcon
              name="charts"
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
          title: "Profile",
          tabBarIcon: ({ color, size, focused }) =>
            authenticated && user
              ? (
                <Image
                  source={{
                    uri: `${DICEBEAR_PROFILE_URL}?seed=${encodeURIComponent(user.nickname ?? user.id)}&backgroundType=solid,gradientLinear`,
                  }}
                  style={{
                    width: size,
                    height: size,
                    borderRadius: size / 2,
                  }}
                />
              )
              : (
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
  { name, color, size, focused }: {
    name: "home" | "search" | "compare" | "charts" | "profile";
    color: string;
    size: number;
    focused: boolean;
  },
) {
  const icons: Record<
    typeof name,
    React.ComponentProps<typeof Feather>["name"]
  > = {
    home: "home",
    search: "search",
    compare: "git-pull-request",
    charts: "bar-chart-2",
    profile: "user",
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
