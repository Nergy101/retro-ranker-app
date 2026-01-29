import { Feather } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import {
  Badge,
  Box,
  Button,
  Center,
  HStack,
  Pressable,
  ScrollView,
  Spinner,
  Text,
  VStack,
} from "native-base";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Modal, TextInput, TouchableWithoutFeedback, View } from "react-native";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { AchievementBoard } from "../../components/achievements/AchievementBoard";
import { DeviceCard } from "../../components/cards/DeviceCard";
import { useAuth } from "../../contexts/AuthContext";
import { useFavoritedDeviceIds } from "../../hooks/useFavoritedDeviceIds";
import { buildAchievementBoard } from "../../services/achievements/achievement.helpers";
import { AchievementService } from "../../services/achievements/achievement.service";
import { DeviceCollectionService } from "../../services/devices/device-collection.service";
import { createPocketBaseService } from "../../services/pocketbase/pocketbase.service";
import { colors } from "../../theme/colors";
import { AchievementStatus } from "../../types/achievement.contract";
import { DeviceCollection } from "../../types/device-collection";
import { Device } from "../../types/device.model";

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
  }, [achievementService, authenticated, user]);

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
  }, [deviceCollectionService, authenticated, user]);

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
  }, [deviceCollectionService, authenticated, user]);

  useEffect(() => {
    loadAchievements();
    loadFavorites();
    loadCollections();
  }, [loadAchievements, loadFavorites, loadCollections]);

  // When not authenticated and auth is settled, redirect to sign-in (no intermediate screen)
  useEffect(() => {
    if (!loading && !authenticated) {
      router.replace("/(tabs)/sign-in");
    }
  }, [loading, authenticated, router]);

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

  // When not authenticated, show brief spinner while redirect to sign-in happens
  if (!authenticated || !user) {
    return (
      <Center flex={1} bg={colors.background}>
        <Spinner size="lg" color={colors.primary} />
      </Center>
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
            pt={Math.max(insets.top, 16)}
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
                      <Feather name="heart" size={20} color={colors.primary} />
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
                router.replace("/(tabs)/profile");
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
                    <Text
                      color={colors.textPrimary}
                      fontSize="lg"
                      fontWeight="semibold"
                    >
                      Leave feedback
                    </Text>
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
                    size="lg"
                    width="100%"
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
