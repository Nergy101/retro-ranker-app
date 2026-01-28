import React, { useEffect, useRef, useState } from "react";
import {
  Box,
  Button,
  Center,
  HStack,
  Image,
  Spinner,
  Text,
  VStack,
} from "native-base";
import { Feather } from "@expo/vector-icons";
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

const API_BASE_URL = "https://retroranker.site";

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

  return (
    <Box flex={1} bg={colors.background}>
      <VStack
        flex={1}
        space={6}
        p={6}
        pt={Math.max(insets.top, 16)}
        justifyContent="center"
        alignItems="center"
        pb={20}
      >
        {/* Logo */}
        <VStack space={2} alignItems="center" mb={8}>
          <Image
            source={{
              uri: "https://retroranker.site/logos/retro-ranker/rr-logo.png",
            }}
            alt="Retro Ranker Logo"
            width={64}
            height={64}
            resizeMode="contain"
          />
          <Text fontSize="2xl" fontWeight="bold" color={colors.textPrimary}>
            Sign In - Retro Ranker
          </Text>
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
                    <Feather
                      name="message-circle"
                      size={22}
                      color={colors.textPrimary}
                    />
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
                    <Feather
                      name="chrome"
                      size={22}
                      color={colors.textPrimary}
                    />
                    <Text color={colors.textPrimary} fontWeight="semibold">
                      Google
                    </Text>
                  </HStack>
                </Button>
              </VStack>
            </VStack>
          )}
      </VStack>
    </Box>
  );
}
