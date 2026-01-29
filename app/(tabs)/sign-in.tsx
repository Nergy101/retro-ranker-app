import React, { useEffect, useRef, useState } from "react";
import {
  Box,
  Button,
  Center,
  HStack,
  Image,
  ScrollView,
  Spinner,
  Text,
  VStack,
} from "native-base";
import { Feather } from "@expo/vector-icons";
import Svg, { Path } from "react-native-svg";
import { useFocusEffect, useRouter } from "expo-router";
import {
  AppState,
  AppStateStatus,
  Linking as ReactNativeLinking,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useAuth } from "../../contexts/AuthContext";
import {
  generateCodeChallenge,
  generateCodeVerifier,
} from "../../services/auth/pkce.service";
import pkceSessionService from "../../services/auth/pkce.service";
import { colors } from "../../theme/colors";
import * as Linking from "expo-linking";
import Constants from "expo-constants";
import { API_BASE_URL } from "../../utils/constants";

function DiscordLogo(
  { size = 22, color = "#ffffff" }: { size?: number; color?: string },
) {
  const aspect = 256 / 199;
  const width = size * aspect;
  return (
    <Svg width={width} height={size} viewBox="0 0 256 199" fill="none">
      <Path
        fill={color}
        d="M216.856 16.597A208.5 208.5 0 0 0 164.042 0c-2.275 4.113-4.933 9.645-6.766 14.046q-29.538-4.442-58.533 0c-1.832-4.4-4.55-9.933-6.846-14.046a207.8 207.8 0 0 0-52.855 16.638C5.618 67.147-3.443 116.4 1.087 164.956c22.169 16.555 43.653 26.612 64.775 33.193A161 161 0 0 0 79.735 175.3a136.4 136.4 0 0 1-21.846-10.632a109 109 0 0 0 5.356-4.237c42.122 19.702 87.89 19.702 129.51 0a132 132 0 0 0 5.355 4.237a136 136 0 0 1-21.886 10.653c4.006 8.02 8.638 15.67 13.873 22.848c21.142-6.58 42.646-16.637 64.815-33.213c5.316-56.288-9.08-105.09-38.056-148.36M85.474 135.095c-12.645 0-23.015-11.805-23.015-26.18s10.149-26.2 23.015-26.2s23.236 11.804 23.015 26.2c.02 14.375-10.148 26.18-23.015 26.18m85.051 0c-12.645 0-23.014-11.805-23.014-26.18s10.148-26.2 23.014-26.2c12.867 0 23.236 11.804 23.015 26.2c0 14.375-10.148 26.18-23.015 26.18"
      />
    </Svg>
  );
}

function GoogleLogo({ size = 22 }: { size?: number }) {
  const aspect = 256 / 262;
  const width = size * aspect;
  return (
    <Svg width={width} height={size} viewBox="0 0 256 262" fill="none">
      <Path
        fill="#4285f4"
        d="M255.878 133.451c0-10.734-.871-18.567-2.756-26.69H130.55v48.448h71.947c-1.45 12.04-9.283 30.172-26.69 42.356l-.244 1.622l38.755 30.023l2.685.268c24.659-22.774 38.875-56.282 38.875-96.027"
      />
      <Path
        fill="#34a853"
        d="M130.55 261.1c35.248 0 64.839-11.605 86.453-31.622l-41.196-31.913c-11.024 7.688-25.82 13.055-45.257 13.055c-34.523 0-63.824-22.773-74.269-54.25l-1.531.13l-40.298 31.187l-.527 1.465C35.393 231.798 79.49 261.1 130.55 261.1"
      />
      <Path
        fill="#fbbc05"
        d="M56.281 156.37c-2.756-8.123-4.351-16.827-4.351-25.82c0-8.994 1.595-17.697 4.206-25.82l-.073-1.73L15.26 71.312l-1.335.635C5.077 89.644 0 109.517 0 130.55s5.077 40.905 13.925 58.602z"
      />
      <Path
        fill="#eb4335"
        d="M130.55 50.479c24.514 0 41.05 10.589 50.479 19.438l36.844-35.974C195.245 12.91 165.798 0 130.55 0C79.49 0 35.393 29.301 13.925 71.947l42.211 32.783c10.59-31.477 39.891-54.251 74.414-54.251"
      />
    </Svg>
  );
}

function getMobileRedirectUrl(provider: "google" | "discord"): string {
  // Expo Go needs an exp://... style URL (Safari can open it back into Expo Go).
  if (Constants.appOwnership === "expo" && Constants.linkingUri) {
    // Expo Go deep links must include the "/--/" segment to route into the app.
    let base = Constants.linkingUri;
    if (!base.endsWith("/")) base += "/";
    if (!base.includes("/--/")) {
      base += "--/";
    } else if (!base.endsWith("/--/")) {
      base = base.replace(/\/--\/.*$/, "/--/");
    }
    return `${base}auth/${provider}/callback`;
  }

  // Standalone/dev builds: use the app scheme from app.json (`retroranker://...`).
  return Linking.createURL(`auth/${provider}/callback`);
}

export default function SignInScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { authenticated, user, loading: authLoading } = useAuth();
  const [oauthLoading, setOauthLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const appState = useRef(AppState.currentState);

  // Reset loading state when screen comes into focus
  useFocusEffect(
    React.useCallback(() => {
      // Reset OAuth loading state when navigating back to this screen
      // This prevents getting stuck if user navigated away during OAuth flow
      if (oauthLoading && !authenticated) {
        // Only reset if we're still not authenticated (OAuth didn't complete)
        // Give it a small delay to allow callback to process if it's happening
        const timeoutId = setTimeout(() => {
          setOauthLoading(null);
          setError(
            "Authentication was cancelled or timed out. Please try again.",
          );
        }, 1000);
        return () => clearTimeout(timeoutId);
      }
    }, [oauthLoading, authenticated]),
  );

  // Handle app state changes (when app comes back from background)
  useEffect(() => {
    const subscription = AppState.addEventListener(
      "change",
      (nextAppState: AppStateStatus) => {
        if (
          appState.current.match(/inactive|background/) &&
          nextAppState === "active" &&
          oauthLoading &&
          !authenticated
        ) {
          // App came back to foreground, reset loading state if not authenticated
          setOauthLoading(null);
          setError("Authentication was cancelled. Please try again.");
        }
        appState.current = nextAppState;
      },
    );

    return () => {
      subscription.remove();
    };
  }, [oauthLoading, authenticated]);

  // Redirect if already authenticated
  useEffect(() => {
    if (authenticated && user && !authLoading) {
      // Reset OAuth loading state when authentication succeeds
      setOauthLoading(null);
      setError(null);
      router.replace("/(tabs)/profile");
    }
  }, [authenticated, user, authLoading, router]);

  const handleOAuthSignIn = async (provider: "google" | "discord") => {
    try {
      setError(null);
      setOauthLoading(provider);

      const codeVerifier = generateCodeVerifier();
      const codeChallenge = await generateCodeChallenge(codeVerifier);
      // Generate UUID-like string for state
      const state = "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(
        /[xy]/g,
        (c) => {
          const r = (Math.random() * 16) | 0;
          const v = c === "x" ? r : (r & 0x3) | 0x8;
          return v.toString(16);
        },
      );

      await pkceSessionService.storeInSession(state, codeVerifier);

      // This is the URL the server will redirect to after completing OAuth.
      // In Expo Go, this becomes an exp://... URL that iOS can open.
      // In a standalone/dev build, this becomes retroranker://... (based on `app.json` scheme).
      const redirectUrl = getMobileRedirectUrl(provider);

      // Pass redirect_uri to server so it knows to redirect back to app
      const encodedRedirectUrl = encodeURIComponent(redirectUrl);
      let oauthUrl: string;
      if (provider === "google") {
        oauthUrl =
          `${API_BASE_URL}/api/auth/google?state=${state}&code_challenge=${
            encodeURIComponent(codeChallenge)
          }&redirect_uri=${encodedRedirectUrl}`;
      } else {
        oauthUrl =
          `${API_BASE_URL}/api/auth/discord?state=${state}&code_challenge=${
            encodeURIComponent(codeChallenge)
          }&redirect_uri=${encodedRedirectUrl}`;
      }

      // Open OAuth URL in browser
      const canOpen = await ReactNativeLinking.canOpenURL(oauthUrl);
      if (canOpen) {
        await ReactNativeLinking.openURL(oauthUrl);
      } else {
        throw new Error("Cannot open OAuth URL");
      }
    } catch (err) {
      console.error("OAuth sign in error:", err);
      setError(
        err instanceof Error ? err.message : "Failed to start OAuth flow",
      );
      setOauthLoading(null);
    }
  };

  if (authLoading) {
    return (
      <Center flex={1} bg={colors.background}>
        <Spinner size="lg" color={colors.primary} />
        <Text color={colors.textSecondary} mt={4}>
          Loading...
        </Text>
      </Center>
    );
  }

  const getLoggingInText = () => {
    const texts = [
      "Pressing Start",
      "Inserting Cartridge",
      "Booting Up",
      "Loading Save",
      "Continuing Game",
      "Joining Party",
      "Entering Dungeon",
    ];
    return texts[Math.floor(Math.random() * texts.length)];
  };

  const features = [
    { label: "Favorite devices", icon: "heart" as const },
    { label: "Write reviews", icon: "star" as const },
    { label: "Create device collections", icon: "folder" as const },
    { label: "Leave comments", icon: "message-circle" as const },
    { label: "Earn achievements", icon: "award" as const },
  ];

  return (
    <Box flex={1} bg={colors.background}>
      <ScrollView
        contentContainerStyle={{
          flexGrow: 1,
          justifyContent: "center",
          padding: 24,
          paddingTop: Math.max(insets.top, 16),
          paddingBottom: 20,
          alignItems: "center",
        }}
        showsVerticalScrollIndicator={false}
      >
        <VStack space={6} alignItems="center" width="100%" maxW="400px">
          {/* Friendly mascot */}
          <VStack space={4} alignItems="center" mb={4}>
            <Image
              source={require("../../assets/images/rr-star.png")}
              alt="Retro Ranker mascot"
              width={120}
              height={120}
              resizeMode="contain"
            />
            <Text fontSize="2xl" fontWeight="bold" color={colors.textPrimary}>
              Sign In - Retro Ranker
            </Text>
          </VStack>

          {/* Features you get with an account */}
          <VStack
            space={2}
            width="100%"
            maxW="400px"
            mb={2}
            p={4}
            bg={colors.backgroundCard}
            borderRadius="md"
            borderWidth={1}
            borderColor={colors.border}
          >
            <Text
              fontSize="sm"
              fontWeight="semibold"
              color={colors.textPrimary}
              mb={1}
            >
              With an account you can
            </Text>
            {features.map(({ label, icon }) => (
              <HStack key={label} space={2} alignItems="center">
                <Feather
                  name={icon}
                  size={16}
                  color={colors.primary}
                />
                <Text fontSize="sm" color={colors.textSecondary}>
                  {label}
                </Text>
              </HStack>
            ))}
          </VStack>

          {oauthLoading
            ? (
              <VStack space={4} alignItems="center" p={6}>
                <Spinner size="lg" color={colors.primary} />
                <Text color={colors.textPrimary} fontSize="md">
                  {getLoggingInText()}...
                </Text>
                <Text
                  color={colors.textSecondary}
                  fontSize="sm"
                  textAlign="center"
                >
                  Please complete authentication in your browser
                </Text>
              </VStack>
            )
            : (
              <VStack space={4} width="100%" maxW="400px">
                {error && (
                  <Box
                    bg={colors.error}
                    p={3}
                    borderRadius="md"
                    mb={2}
                  >
                    <Text color={colors.textPrimary} fontSize="sm">
                      {error}
                    </Text>
                  </Box>
                )}

                <Text
                  fontSize="md"
                  color={colors.textSecondary}
                  textAlign="center"
                  mb={2}
                >
                  Continue with
                </Text>

                <VStack space={3}>
                  <Button
                    onPress={() => handleOAuthSignIn("discord")}
                    bg="#5865F2"
                    _pressed={{ bg: "#4752C4" }}
                    size="lg"
                    isLoading={oauthLoading === "discord"}
                    isDisabled={!!oauthLoading}
                  >
                    <HStack space={2} alignItems="center">
                      <DiscordLogo size={22} color={colors.textPrimary} />
                      <Text color={colors.textPrimary} fontWeight="semibold">
                        Discord
                      </Text>
                    </HStack>
                  </Button>

                  <Button
                    onPress={() => handleOAuthSignIn("google")}
                    bg={colors.backgroundCard}
                    borderWidth={1}
                    borderColor={colors.border}
                    _pressed={{ bg: colors.backgroundElevated }}
                    size="lg"
                    isLoading={oauthLoading === "google"}
                    isDisabled={!!oauthLoading}
                  >
                    <HStack space={2} alignItems="center">
                      <GoogleLogo size={22} />
                      <Text color={colors.textPrimary} fontWeight="semibold">
                        Google
                      </Text>
                    </HStack>
                  </Button>
                </VStack>
              </VStack>
            )}
        </VStack>
      </ScrollView>
    </Box>
  );
}
