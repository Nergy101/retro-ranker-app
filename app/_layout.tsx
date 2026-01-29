import "react-native-gesture-handler";
import { Stack } from "expo-router";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { NativeBaseProvider } from "native-base";
import { View } from "react-native";
import { theme } from "../theme/nativebase-theme";
import { AuthProvider } from "../contexts/AuthContext";
import { FavoritedDeviceIdsProvider } from "../contexts/FavoritedDeviceIdsContext";
import { NetworkProvider } from "../contexts/NetworkContext";
import { OfflineBanner } from "../components/shared/OfflineBanner";

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <NetworkProvider>
        <AuthProvider>
          <FavoritedDeviceIdsProvider>
            <NativeBaseProvider theme={theme}>
              <OfflineBanner />
              <View style={{ flex: 1 }}>
                <Stack
                  screenOptions={{
                    headerStyle: {
                      backgroundColor: "#1a1a1a",
                    },
                    headerTintColor: "#ffffff",
                    headerTitleStyle: {
                      color: "#ffffff",
                    },
                    gestureEnabled: true,
                    gestureDirection: "horizontal",
                    fullScreenGestureEnabled: true,
                  }}
                >
                  <Stack.Screen
                    name="(tabs)"
                    options={{ headerShown: false, title: "Home" }}
                  />
                  <Stack.Screen
                    name="devices/[name]"
                    options={{
                      title: "Device Details",
                      headerStyle: { backgroundColor: "#1a1a1a" },
                      headerTintColor: "#FF6B35",
                    }}
                  />
                  <Stack.Screen
                    name="collections/[id]"
                    options={{
                      title: "Collection",
                      headerStyle: { backgroundColor: "#1a1a1a" },
                      headerTintColor: "#FF6B35",
                    }}
                  />
                  <Stack.Screen
                    name="auth/[provider]/callback"
                    options={{
                      headerShown: false,
                      presentation: "modal",
                      gestureEnabled: false,
                    }}
                  />
                </Stack>
              </View>
            </NativeBaseProvider>
          </FavoritedDeviceIdsProvider>
        </AuthProvider>
      </NetworkProvider>
    </GestureHandlerRootView>
  );
}
