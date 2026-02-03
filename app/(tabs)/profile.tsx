import { Feather } from "@expo/vector-icons";
import { useFocusEffect, useRouter } from "expo-router";
import Constants from "expo-constants";
import * as Linking from "expo-linking";
import {
  Badge,
  Box,
  Button,
  Center,
  HStack,
  Image,
  Pressable,
  ScrollView,
  Spinner,
  Text,
  VStack,
} from "native-base";
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  AppState,
  AppStateStatus,
  Linking as ReactNativeLinking,
  Modal,
  TextInput,
  TouchableWithoutFeedback,
  View,
} from "react-native";
import Svg, { Path } from "react-native-svg";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { AchievementBoard } from "../../components/achievements/AchievementBoard";
import { DeviceCard } from "../../components/cards/DeviceCard";
import { useAuth } from "../../contexts/AuthContext";
import { useFavoritedDeviceIds } from "../../hooks/useFavoritedDeviceIds";
import { buildAchievementBoard } from "../../services/achievements/achievement.helpers";
import { AchievementService } from "../../services/achievements/achievement.service";
import { DeviceCollectionService } from "../../services/devices/device-collection.service";
import {
  generateCodeChallenge,
  generateCodeVerifier,
} from "../../services/auth/pkce.service";
import pkceSessionService from "../../services/auth/pkce.service";
import { createPocketBaseService } from "../../services/pocketbase/pocketbase.service";
import { colors } from "../../theme/colors";
import { API_BASE_URL, SAFE_AREA_TOP_PADDING_MIN } from "../../utils/constants";
import { AchievementStatus } from "../../types/achievement.contract";
import { DeviceCollection } from "../../types/device-collection";
import { Device } from "../../types/device.model";

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
  if (Constants.appOwnership === "expo" && Constants.linkingUri) {
    let base = Constants.linkingUri;
    if (!base.endsWith("/")) base += "/";
    if (!base.includes("/--/")) {
      base += "--/";
    } else if (!base.endsWith("/--/")) {
      base = base.replace(/\/--\/.*$/, "/--/");
    }
    return `${base}auth/${provider}/callback`;
  }
  return Linking.createURL(`auth/${provider}/callback`);
}

export default function ProfilePage() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user, loading, authenticated, signOut } = useAuth();
  const [achievements, setAchievements] = useState<AchievementStatus[]>([]);
  const [loadingAchievements, setLoadingAchievements] = useState(true);
  const [checkingAchievements, setCheckingAchievements] = useState(false);
  const [achievementService] = useState(() => new AchievementService());
  const [favoritedDevices, setFavoritedDevices] = useState<Device[]>([]);
  const [collections, setCollections] = useState<DeviceCollection[]>([]);
  const [loadingFavorites, setLoadingFavorites] = useState(true);
  const [loadingCollections, setLoadingCollections] = useState(true);
  const [deviceCollectionService] = useState(() =>
    DeviceCollectionService.getInstance()
  );
  const { favoritedDeviceIds } = useFavoritedDeviceIds();
  const [favoritesExpanded, setFavoritesExpanded] = useState(false);
  const [achievementsExpanded, setAchievementsExpanded] = useState(false);
  const [collectionsExpanded, setCollectionsExpanded] = useState(false);
  const [feedbackModalOpen, setFeedbackModalOpen] = useState(false);
  const [feedbackText, setFeedbackText] = useState("");
  const [feedbackSending, setFeedbackSending] = useState(false);
  const [feedbackError, setFeedbackError] = useState<string | null>(null);
  const [oauthLoading, setOauthLoading] = useState<string | null>(null);
  const [oauthError, setOauthError] = useState<string | null>(null);
  const appState = useRef(AppState.currentState);

  const handleSendFeedback = useCallback(async () => {
    const trimmed = feedbackText.trim();
    if (!trimmed || feedbackSending) return;
    setFeedbackSending(true);
    setFeedbackError(null);
    try {
      const pb = createPocketBaseService();
      await pb.create("suggestions", {
        suggestion: trimmed,
        ...(user?.id && { user: user.id }),
      });
      setFeedbackText("");
      setFeedbackModalOpen(false);
    } catch (err) {
      console.error("Error submitting feedback:", err);
      setFeedbackError(
        err instanceof Error ? err.message : "Failed to send feedback",
      );
    } finally {
      setFeedbackSending(false);
    }
  }, [feedbackText, feedbackSending, user?.id]);

  const loadAchievements = useCallback(async () => {
    if (!authenticated || !user) return;

    try {
      setLoadingAchievements(true);
      const [metrics, unlockedIds] = await Promise.all([
        achievementService.getUserMetrics(user.id),
        achievementService.getUnlockedAchievementIds(user.id),
      ]);

      const achievementBoard = buildAchievementBoard(metrics, unlockedIds);
      setAchievements(achievementBoard);
    } catch (error) {
      console.error("Error loading achievements:", error);
    } finally {
      setLoadingAchievements(false);
    }
  }, [achievementService, authenticated, user?.id]);

  const loadFavorites = useCallback(async () => {
    if (!authenticated || !user) return;

    try {
      setLoadingFavorites(true);
      const devices = await deviceCollectionService.getUserFavoritedDevices(
        user.id,
      );
      setFavoritedDevices(devices);
    } catch (error) {
      console.error("Error loading favorites:", error);
    } finally {
      setLoadingFavorites(false);
    }
  }, [deviceCollectionService, authenticated, user?.id]);

  const loadCollections = useCallback(async () => {
    if (!authenticated || !user) return;

    try {
      setLoadingCollections(true);
      const userCollections = await deviceCollectionService
        .getUserDeviceCollections(user.id);
      setCollections(userCollections);
    } catch (error) {
      console.error("Error loading collections:", error);
    } finally {
      setLoadingCollections(false);
    }
  }, [deviceCollectionService, authenticated, user?.id]);

  // Load profile data only when screen gains focus (not when tapping same tab again).
  useFocusEffect(
    useCallback(() => {
      if (!authenticated || !user?.id) return;
      loadAchievements();
      loadFavorites();
      loadCollections();
    }, [authenticated, user?.id, loadAchievements, loadFavorites, loadCollections]),
  );

  // Reset OAuth loading when profile (sign-in) screen gains focus and still not authenticated
  useFocusEffect(
    useCallback(() => {
      if (oauthLoading && !authenticated) {
        const timeoutId = setTimeout(() => {
          setOauthLoading(null);
          setOauthError(
            "Authentication was cancelled or timed out. Please try again.",
          );
        }, 1000);
        return () => clearTimeout(timeoutId);
      }
    }, [oauthLoading, authenticated]),
  );

  // When app comes back from background during OAuth, reset loading if not authenticated
  useEffect(() => {
    const sub = AppState.addEventListener(
      "change",
      (nextAppState: AppStateStatus) => {
        if (
          appState.current.match(/inactive|background/) &&
          nextAppState === "active" &&
          oauthLoading &&
          !authenticated
        ) {
          setOauthLoading(null);
          setOauthError("Authentication was cancelled. Please try again.");
        }
        appState.current = nextAppState;
      },
    );
    return () => sub.remove();
  }, [oauthLoading, authenticated]);

  const handleOAuthSignIn = useCallback(
    async (provider: "google" | "discord") => {
      try {
        setOauthError(null);
        setOauthLoading(provider);
        const codeVerifier = generateCodeVerifier();
        const codeChallenge = await generateCodeChallenge(codeVerifier);
        const state = "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(
          /[xy]/g,
          (c) => {
            const r = (Math.random() * 16) | 0;
            const v = c === "x" ? r : (r & 0x3) | 0x8;
            return v.toString(16);
          },
        );
        await pkceSessionService.storeInSession(state, codeVerifier);
        const redirectUrl = getMobileRedirectUrl(provider);
        const encodedRedirectUrl = encodeURIComponent(redirectUrl);
        const oauthUrl =
          provider === "google"
            ? `${API_BASE_URL}/api/auth/google?state=${state}&code_challenge=${encodeURIComponent(codeChallenge)}&redirect_uri=${encodedRedirectUrl}`
            : `${API_BASE_URL}/api/auth/discord?state=${state}&code_challenge=${encodeURIComponent(codeChallenge)}&redirect_uri=${encodedRedirectUrl}`;
        const canOpen = await ReactNativeLinking.canOpenURL(oauthUrl);
        if (canOpen) await ReactNativeLinking.openURL(oauthUrl);
        else throw new Error("Cannot open OAuth URL");
      } catch (err) {
        console.error("OAuth sign in error:", err);
        setOauthError(
          err instanceof Error ? err.message : "Failed to start OAuth flow",
        );
        setOauthLoading(null);
      }
    },
    [],
  );

  // Memoize welcome text so it only generates once per page load (must be before any conditional return)
  const welcomeText = useMemo(() => {
    const texts = [
      "Ready, Player One!",
      "The Chosen Hero.",
      "Continue >",
      "Back for More?",
      "Let's Go!",
      "Back online?",
      "Link established.",
      "Respawned.",
      "Snacks inserted.",
      "Boot completed.",
      "Memory Card Inserted.",
      "Retro XP Gained.",
      "Retro vibes activated.",
      "Entered the handheld dimension.",
    ];
    return texts[Math.floor(Math.random() * texts.length)];
  }, []);

  if (loading) {
    return (
      <Box flex={1} bg={colors.background}>
        <Center flex={1}>
          <Spinner size="lg" color={colors.primary} />
          <Text color={colors.textSecondary} mt={4}>
            Loading...
          </Text>
        </Center>
      </Box>
    );
  }

  // When not authenticated, show full sign-in UI (same as former sign-in page)
  if (!authenticated || !user) {
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
    const signInFeatures = [
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
            paddingTop: Math.max(insets.top, SAFE_AREA_TOP_PADDING_MIN),
            paddingBottom: Math.max(insets.bottom, 24),
            alignItems: "center",
          }}
          showsVerticalScrollIndicator={false}
        >
          <VStack space={6} alignItems="center" width="100%" maxW="400px">
            <VStack space={4} alignItems="center" mb={4}>
              <Image
                source={require("../../assets/images/rr-star.png")}
                alt="Retro Ranker mascot"
                width={120}
                height={120}
                resizeMode="contain"
              />
              <Text fontSize="2xl" fontWeight="bold" color={colors.textPrimary}>
                Well, hello there!
              </Text>
            </VStack>
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
              {signInFeatures.map(({ label, icon }) => (
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
                  {oauthError && (
                    <Box bg={colors.error} p={3} borderRadius="md" mb={2}>
                      <Text color={colors.textPrimary} fontSize="sm">
                        {oauthError}
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

  const handleCheckAchievements = async () => {
    if (!user) return;

    try {
      setCheckingAchievements(true);
      await achievementService.checkAndUnlockAchievements(user.id);
      // Reload achievements to show newly unlocked ones
      await loadAchievements();
    } catch (error) {
      console.error("Error checking achievements:", error);
    } finally {
      setCheckingAchievements(false);
    }
  };

  // Swipe gesture handler for tab navigation
  const swipeGesture = Gesture.Pan()
    .activeOffsetX([-10, 10])
    .failOffsetY([-5, 5])
    .onEnd((event) => {
      const swipeThreshold = 50;
      if (event.translationX > swipeThreshold) {
        // Swipe right - go to previous tab (Compare)
        router.push("/(tabs)/compare");
      } else if (event.translationX < -swipeThreshold) {
        // Swipe left - go to first tab (Home) for circular navigation
        router.push("/(tabs)/");
      }
    });

  return (
    <GestureDetector gesture={swipeGesture}>
      <Box flex={1} bg={colors.background}>
        <ScrollView showsVerticalScrollIndicator={false}>
          <VStack
            space={4}
            p={6}
            style={{ paddingTop: Math.max(insets.top, SAFE_AREA_TOP_PADDING_MIN) }}
            pb={Math.max(insets.bottom, 24)}
          >
            <VStack space={2}>
              <Text color={colors.primary} fontSize="2xl" fontWeight="bold">
                {welcomeText}
              </Text>
              <Text color={colors.textPrimary} fontSize="lg">
                Welcome {user?.nickname}.
              </Text>
            </VStack>

            {/* Favorite Devices Section */}
            <Box
              bg={colors.backgroundCard}
              borderRadius="md"
              borderWidth={1}
              borderColor={colors.border}
              overflow="hidden"
            >
              <Pressable
                onPress={() => setFavoritesExpanded(!favoritesExpanded)}
              >
                <Box
                  p={4}
                  bg={favoritesExpanded
                    ? colors.backgroundElevated
                    : colors.backgroundCard}
                >
                  <HStack justifyContent="space-between" alignItems="center">
                    <HStack alignItems="center" space={2}>
                      <Feather name="heart" size={20} color={colors.favorite} />
                      <Text
                        color={colors.textPrimary}
                        fontSize="lg"
                        fontWeight="semibold"
                      >
                        Favorites
                      </Text>
                      <Badge
                        bg={colors.primaryFocus}
                        borderRadius="full"
                        px={2}
                        py={0.5}
                      >
                        <Text fontSize="xs" color={colors.textSecondary}>
                          {favoritedDevices.length}{" "}
                          {favoritedDevices.length === 1 ? "device" : "devices"}
                        </Text>
                      </Badge>
                    </HStack>
                    <Feather
                      name={favoritesExpanded ? "chevron-up" : "chevron-down"}
                      size={20}
                      color={colors.textSecondary}
                    />
                  </HStack>
                </Box>
              </Pressable>

              {favoritesExpanded && (
                <Box p={4} pt={0}>
                  {loadingFavorites
                    ? (
                      <Center py={8}>
                        <Spinner size="lg" color={colors.primary} />
                        <Text color={colors.textSecondary} mt={4}>
                          Loading favorites...
                        </Text>
                      </Center>
                    )
                    : favoritedDevices.length === 0
                    ? (
                      <Center py={8}>
                        <Text color={colors.textSecondary} textAlign="center">
                          No favorites yet
                        </Text>
                        <Text
                          color={colors.textTertiary}
                          fontSize="sm"
                          textAlign="center"
                          mt={2}
                        >
                          Start exploring devices and add them to your favorites
                          to see them here.
                        </Text>
                      </Center>
                    )
                    : (
                      <VStack space={3} mt={4}>
                        {Array.from({
                          length: Math.ceil(favoritedDevices.length / 2),
                        }).map((_, rowIndex) => (
                          <HStack key={rowIndex} space={3} width="100%">
                            {favoritedDevices
                              .slice(rowIndex * 2, rowIndex * 2 + 2)
                              .map((device) => (
                                <Box key={device.id} flex={1} height={280}>
                                  <DeviceCard
                                    device={device}
                                    onPress={() =>
                                      router.push(
                                        `/devices/${device.name.sanitized}`,
                                      )}
                                    isFavorited={favoritedDeviceIds.has(
                                      device.id,
                                    )}
                                  />
                                </Box>
                              ))}
                            {/* Fill empty slot if odd number of items */}
                            {favoritedDevices.slice(
                                  rowIndex * 2,
                                  rowIndex * 2 + 2,
                                ).length === 1 && <Box flex={1} />}
                          </HStack>
                        ))}
                      </VStack>
                    )}
                </Box>
              )}
            </Box>

            {/* Achievements Section */}
            <Box
              bg={colors.backgroundCard}
              borderRadius="md"
              borderWidth={1}
              borderColor={colors.border}
              overflow="hidden"
            >
              <Pressable
                onPress={() => setAchievementsExpanded(!achievementsExpanded)}
              >
                <Box
                  p={4}
                  bg={achievementsExpanded
                    ? colors.backgroundElevated
                    : colors.backgroundCard}
                >
                  <HStack justifyContent="space-between" alignItems="center">
                    <HStack alignItems="center" space={2}>
                      <Feather name="award" size={20} color={colors.primary} />
                      <Text
                        color={colors.textPrimary}
                        fontSize="lg"
                        fontWeight="semibold"
                      >
                        Achievements
                      </Text>
                      <Badge
                        bg={colors.primaryFocus}
                        borderRadius="full"
                        px={2}
                        py={0.5}
                      >
                        <Text fontSize="xs" color={colors.textSecondary}>
                          {achievements.filter((a) => a.unlocked)
                            .length}/{achievements.length} achieved
                        </Text>
                      </Badge>
                    </HStack>
                    <Feather
                      name={achievementsExpanded
                        ? "chevron-up"
                        : "chevron-down"}
                      size={20}
                      color={colors.textSecondary}
                    />
                  </HStack>
                </Box>
              </Pressable>

              {achievementsExpanded && (
                <Box p={4} pt={0}>
                  {loadingAchievements
                    ? (
                      <Center py={8}>
                        <Spinner size="lg" color={colors.primary} />
                        <Text color={colors.textSecondary} mt={4}>
                          Loading achievements...
                        </Text>
                      </Center>
                    )
                    : achievements.length > 0
                    ? (
                      <Box mt={4}>
                        <AchievementBoard achievements={achievements} />
                      </Box>
                    )
                    : (
                      <Center py={8}>
                        <Text color={colors.textSecondary}>
                          No achievements available
                        </Text>
                      </Center>
                    )}
                </Box>
              )}
            </Box>

            {/* Device Collections Section */}
            <Box
              bg={colors.backgroundCard}
              borderRadius="md"
              borderWidth={1}
              borderColor={colors.border}
              overflow="hidden"
            >
              <Pressable
                onPress={() => setCollectionsExpanded(!collectionsExpanded)}
              >
                <Box
                  p={4}
                  bg={collectionsExpanded
                    ? colors.backgroundElevated
                    : colors.backgroundCard}
                >
                  <HStack justifyContent="space-between" alignItems="center">
                    <HStack alignItems="center" space={2}>
                      <Feather name="folder" size={20} color={colors.primary} />
                      <Text
                        color={colors.textPrimary}
                        fontSize="lg"
                        fontWeight="semibold"
                      >
                        Collections
                      </Text>
                      <Badge
                        bg={colors.primaryFocus}
                        borderRadius="full"
                        px={2}
                        py={0.5}
                      >
                        <Text fontSize="xs" color={colors.textSecondary}>
                          {collections.length} {collections.length === 1
                            ? "collection"
                            : "collections"}
                        </Text>
                      </Badge>
                    </HStack>
                    <Feather
                      name={collectionsExpanded ? "chevron-up" : "chevron-down"}
                      size={20}
                      color={colors.textSecondary}
                    />
                  </HStack>
                </Box>
              </Pressable>

              {collectionsExpanded && (
                <Box p={4} pt={0}>
                  {loadingCollections
                    ? (
                      <Center py={8}>
                        <Spinner size="lg" color={colors.primary} />
                        <Text color={colors.textSecondary} mt={4}>
                          Loading collections...
                        </Text>
                      </Center>
                    )
                    : collections.length === 0
                    ? (
                      <Center py={8}>
                        <Text color={colors.textSecondary} textAlign="center">
                          No collections yet
                        </Text>
                        <Text
                          color={colors.textTertiary}
                          fontSize="sm"
                          textAlign="center"
                          mt={2}
                        >
                          Create your first collection to organize your favorite
                          devices.
                        </Text>
                      </Center>
                    )
                    : (
                      <VStack space={4} mt={4}>
                        {collections.map((collection) => {
                          const displayDevices = collection.devices.slice(0, 4);
                          return (
                            <Pressable
                              key={collection.id}
                              onPress={() =>
                                router.push(`/collections/${collection.id}`)}
                            >
                              <Box
                                bg={colors.backgroundCard}
                                borderRadius="md"
                                borderWidth={1}
                                borderColor={colors.border}
                                p={4}
                              >
                                <VStack space={3}>
                                  <VStack space={1}>
                                    <Text
                                      color={colors.textPrimary}
                                      fontSize="md"
                                      fontWeight="semibold"
                                    >
                                      {collection.name}
                                    </Text>
                                    <Badge
                                      bg={colors.primaryFocus}
                                      borderRadius="full"
                                      px={2}
                                      py={0.5}
                                      alignSelf="flex-start"
                                    >
                                      <Text
                                        fontSize="xs"
                                        color={colors.textSecondary}
                                      >
                                        {collection.deviceCount}{" "}
                                        {collection.deviceCount === 1
                                          ? "device"
                                          : "devices"}
                                      </Text>
                                    </Badge>
                                    {collection.description && (
                                      <Text
                                        color={colors.textSecondary}
                                        fontSize="sm"
                                      >
                                        {collection.description}
                                      </Text>
                                    )}
                                  </VStack>

                                  {displayDevices.length > 0
                                    ? (
                                      <VStack space={2}>
                                        {Array.from({
                                          length: Math.ceil(
                                            displayDevices.length / 2,
                                          ),
                                        }).map((_, rowIndex) => (
                                          <HStack
                                            key={rowIndex}
                                            space={2}
                                            width="100%"
                                          >
                                            {displayDevices
                                              .slice(
                                                rowIndex * 2,
                                                rowIndex * 2 + 2,
                                              )
                                              .map((device) => (
                                                <Box
                                                  key={device.id}
                                                  flex={1}
                                                  height={180}
                                                >
                                                  <DeviceCard
                                                    device={device}
                                                    onPress={() =>
                                                      router.push(
                                                        `/devices/${device.name.sanitized}`,
                                                      )}
                                                    imageOnly={true}
                                                    isFavorited={favoritedDeviceIds
                                                      .has(
                                                        device.id,
                                                      )}
                                                  />
                                                </Box>
                                              ))}
                                            {/* Fill empty slot if odd number of items */}
                                            {displayDevices.slice(
                                                  rowIndex * 2,
                                                  rowIndex * 2 + 2,
                                                ).length === 1 && (
                                              <Box flex={1} />
                                            )}
                                          </HStack>
                                        ))}
                                      </VStack>
                                    )
                                    : (
                                      <Text
                                        color={colors.textTertiary}
                                        fontSize="sm"
                                        textAlign="center"
                                        py={2}
                                      >
                                        No devices in this collection
                                      </Text>
                                    )}
                                </VStack>
                              </Box>
                            </Pressable>
                          );
                        })}
                      </VStack>
                    )}
                </Box>
              )}
            </Box>

            {/* Leave feedback */}
            <Box
              bg={colors.backgroundCard}
              borderRadius="md"
              borderWidth={1}
              borderColor={colors.border}
              overflow="hidden"
              mt={8}
            >
              <Pressable
                onPress={() => {
                  setFeedbackError(null);
                  setFeedbackText("");
                  setFeedbackModalOpen(true);
                }}
              >
                <Box p={4}>
                  <HStack alignItems="center" space={2}>
                    <Feather
                      name="message-square"
                      size={20}
                      color={colors.primary}
                    />
                    <Text
                      color={colors.textPrimary}
                      fontSize="lg"
                      fontWeight="semibold"
                    >
                      Leave feedback
                    </Text>
                  </HStack>
                </Box>
              </Pressable>
            </Box>

            {/* Sign Out - at bottom of content */}
            <Button
              onPress={() => {
                signOut();
                // When signed out, profile shows the sign-in UI (no redirect)
              }}
              bg={colors.error}
              _pressed={{ bg: "#8a0a0a", opacity: 0.95 }}
              size="lg"
              width="100%"
              mt={3}
            >
              <HStack space={2} alignItems="center">
                <Feather
                  name="log-out"
                  size={20}
                  color={colors.primaryContrast}
                />
                <Text
                  color={colors.primaryContrast}
                  fontWeight="semibold"
                  fontSize="md"
                >
                  Sign Out
                </Text>
              </HStack>
            </Button>
          </VStack>
        </ScrollView>

        {/* Feedback modal */}
        <Modal
          visible={feedbackModalOpen}
          transparent
          animationType="fade"
          onRequestClose={() => setFeedbackModalOpen(false)}
        >
          <TouchableWithoutFeedback onPress={() => setFeedbackModalOpen(false)}>
            <View
              style={{
                flex: 1,
                backgroundColor: "rgba(0,0,0,0.5)",
                justifyContent: "center",
                alignItems: "center",
                padding: 24,
              }}
            >
              <TouchableWithoutFeedback onPress={(e) => e.stopPropagation()}>
                <Box
                  bg={colors.backgroundCard}
                  borderRadius="md"
                  width="100%"
                  maxWidth={400}
                  borderWidth={1}
                  borderColor={colors.border}
                  p={4}
                >
                  <HStack
                    justifyContent="space-between"
                    alignItems="center"
                    mb={3}
                  >
                    <HStack alignItems="center" space={2}>
                      <Feather
                        name="message-square"
                        size={20}
                        color={colors.primary}
                      />
                      <Text
                        color={colors.textPrimary}
                        fontSize="lg"
                        fontWeight="semibold"
                      >
                        Leave feedback
                      </Text>
                    </HStack>
                    <Pressable
                      onPress={() => setFeedbackModalOpen(false)}
                      p={1}
                    >
                      <Feather
                        name="x"
                        size={24}
                        color={colors.textSecondary}
                      />
                    </Pressable>
                  </HStack>
                  <TextInput
                    placeholder="Your suggestion or feedback..."
                    placeholderTextColor={colors.textTertiary}
                    value={feedbackText}
                    onChangeText={setFeedbackText}
                    multiline
                    numberOfLines={5}
                    style={{
                      backgroundColor: colors.background,
                      borderColor: colors.border,
                      borderWidth: 1,
                      borderRadius: 8,
                      color: colors.textPrimary,
                      fontSize: 16,
                      minHeight: 120,
                      paddingHorizontal: 12,
                      paddingVertical: 12,
                      textAlignVertical: "top",
                      marginBottom: 12,
                    }}
                  />
                  {feedbackError && (
                    <Text color={colors.error} fontSize="sm" mb={2}>
                      {feedbackError}
                    </Text>
                  )}
                  <Button
                    onPress={handleSendFeedback}
                    isLoading={feedbackSending}
                    isDisabled={feedbackSending || !feedbackText.trim()}
                    bg={colors.primary}
                    _pressed={{ bg: colors.primaryHover }}
                    _disabled={{ bg: colors.border, opacity: 0.7 }}
                    size="lg"
                    width="100%"
                    style={{ backgroundColor: colors.primary }}
                    leftIcon={
                      <Feather
                        name="send"
                        size={18}
                        color={colors.primaryContrast}
                      />
                    }
                  >
                    <Text color={colors.primaryContrast} fontWeight="semibold">
                      Send
                    </Text>
                  </Button>
                </Box>
              </TouchableWithoutFeedback>
            </View>
          </TouchableWithoutFeedback>
        </Modal>
      </Box>
    </GestureDetector>
  );
}
