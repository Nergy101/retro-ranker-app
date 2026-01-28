import React, { useState, useEffect, useCallback } from 'react';
import { Box, Text, Center, Button, VStack, HStack, Spinner, ScrollView, Badge, Pressable } from 'native-base';
import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { GestureDetector, Gesture } from 'react-native-gesture-handler';
import { Dimensions } from 'react-native';
import { useAuth } from '../../contexts/AuthContext';
import { colors } from '../../theme/colors';
import { AchievementService } from '../../services/achievements/achievement.service';
import { buildAchievementBoard } from '../../services/achievements/achievement.helpers';
import { AchievementStatus } from '../../types/achievement.contract';
import { AchievementBoard } from '../../components/achievements/AchievementBoard';
import { DeviceCollectionService } from '../../services/devices/device-collection.service';
import { Device } from '../../types/device.model';
import { DeviceCollection } from '../../types/device-collection';
import { DeviceCard } from '../../components/cards/DeviceCard';
import { DeviceCardRow } from '../../components/cards/DeviceCardRow';

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
  const [deviceCollectionService] = useState(() => DeviceCollectionService.getInstance());
  const [favoritesExpanded, setFavoritesExpanded] = useState(false);
  const [achievementsExpanded, setAchievementsExpanded] = useState(false);
  const [collectionsExpanded, setCollectionsExpanded] = useState(false);

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
      console.error('Error loading achievements:', error);
    } finally {
      setLoadingAchievements(false);
    }
  }, [achievementService, authenticated, user]);

  const loadFavorites = useCallback(async () => {
    if (!authenticated || !user) return;

    try {
      setLoadingFavorites(true);
      const devices = await deviceCollectionService.getUserFavoritedDevices(user.id);
      setFavoritedDevices(devices);
    } catch (error) {
      console.error('Error loading favorites:', error);
    } finally {
      setLoadingFavorites(false);
    }
  }, [deviceCollectionService, authenticated, user]);

  const loadCollections = useCallback(async () => {
    if (!authenticated || !user) return;

    try {
      setLoadingCollections(true);
      const userCollections = await deviceCollectionService.getUserDeviceCollections(user.id);
      setCollections(userCollections);
    } catch (error) {
      console.error('Error loading collections:', error);
    } finally {
      setLoadingCollections(false);
    }
  }, [deviceCollectionService, authenticated, user]);

  useEffect(() => {
    loadAchievements();
    loadFavorites();
    loadCollections();
  }, [loadAchievements, loadFavorites, loadCollections]);

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

  if (!authenticated || !user) {
    return (
      <Box flex={1} bg={colors.background}>
        <Center flex={1} px={6}>
          <VStack space={4} alignItems="center">
            <Text color={colors.textPrimary} fontSize="xl" fontWeight="bold">
              Sign In Required
            </Text>
            <Text color={colors.textSecondary} textAlign="center">
              Please sign in to view your profile and achievements
            </Text>
            <Button
              onPress={() => router.push('/auth/sign-in')}
              bg={colors.primary}
              _pressed={{ bg: colors.primaryHover }}
              size="lg"
              width="100%"
              maxW="300px"
            >
              <Text color={colors.textPrimary} fontWeight="semibold">
                Sign In
              </Text>
            </Button>
          </VStack>
        </Center>
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
      console.error('Error checking achievements:', error);
    } finally {
      setCheckingAchievements(false);
    }
  };

  const getWelcomeText = () => {
    const texts = [
      'Player One',
      'Hero',
      'Continue',
      'Back for More',
      "Let's Go",
      'Back Online',
      'Link Established',
      'Respawned',
      'Insert Snacks',
      'Boot Complete',
      'Memory Card',
      'Retro XP',
      'Retro Vibes',
      'Handheld Dimension',
    ];
    return texts[Math.floor(Math.random() * texts.length)];
  };

  // Swipe gesture handler for tab navigation
  const swipeGesture = Gesture.Pan()
    .activeOffsetX([-10, 10])
    .failOffsetY([-5, 5])
    .onEnd((event) => {
      const swipeThreshold = 50;
      if (event.translationX > swipeThreshold) {
        // Swipe right - go to previous tab (Compare)
        router.push('/(tabs)/compare');
      } else if (event.translationX < -swipeThreshold) {
        // Swipe left - go to first tab (Home) for circular navigation
        router.push('/(tabs)/');
      }
    });

  return (
    <GestureDetector gesture={swipeGesture}>
      <Box flex={1} bg={colors.background}>
        <ScrollView>
          <VStack
            space={4}
            p={6}
            pt={Math.max(insets.top, 16)}
          >
          <VStack space={2}>
            <Text color={colors.primary} fontSize="2xl" fontWeight="bold">
              {getWelcomeText()}, welcome {user?.nickname}.
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
            <Pressable onPress={() => setFavoritesExpanded(!favoritesExpanded)}>
              <Box
                p={4}
                bg={favoritesExpanded ? colors.backgroundElevated : colors.backgroundCard}
              >
                <HStack justifyContent="space-between" alignItems="center">
                  <HStack alignItems="center" space={2}>
                    <Feather name="heart" size={20} color={colors.primary} />
                    <Text color={colors.textPrimary} fontSize="lg" fontWeight="semibold">
                      Favorites
                    </Text>
                    <Badge
                      bg={colors.primaryFocus}
                      borderRadius="full"
                      px={2}
                      py={0.5}
                    >
                      <Text fontSize="xs" color={colors.textSecondary}>
                        {favoritedDevices.length} {favoritedDevices.length === 1 ? 'device' : 'devices'}
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
                {loadingFavorites ? (
                  <Center py={8}>
                    <Spinner size="lg" color={colors.primary} />
                    <Text color={colors.textSecondary} mt={4}>
                      Loading favorites...
                    </Text>
                  </Center>
                ) : favoritedDevices.length === 0 ? (
                  <Center py={8}>
                    <Text color={colors.textSecondary} textAlign="center">
                      No favorites yet
                    </Text>
                    <Text color={colors.textTertiary} fontSize="sm" textAlign="center" mt={2}>
                      Start exploring devices and add them to your favorites to see them here.
                    </Text>
                  </Center>
                ) : (
                  <VStack space={3} mt={4}>
                    {Array.from({ length: Math.ceil(favoritedDevices.length / 2) }).map((_, rowIndex) => (
                      <HStack key={rowIndex} space={3} width="100%">
                        {favoritedDevices
                          .slice(rowIndex * 2, rowIndex * 2 + 2)
                          .map((device) => (
                            <Box key={device.id} flex={1} height={280}>
                              <DeviceCard
                                device={device}
                                onPress={() => router.push(`/devices/${device.name.sanitized}`)}
                              />
                            </Box>
                          ))}
                        {/* Fill empty slot if odd number of items */}
                        {favoritedDevices.slice(rowIndex * 2, rowIndex * 2 + 2).length === 1 && (
                          <Box flex={1} />
                        )}
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
            <Pressable onPress={() => setAchievementsExpanded(!achievementsExpanded)}>
              <Box
                p={4}
                bg={achievementsExpanded ? colors.backgroundElevated : colors.backgroundCard}
              >
                <HStack justifyContent="space-between" alignItems="center">
                  <HStack alignItems="center" space={2}>
                    <Feather name="award" size={20} color={colors.primary} />
                    <Text color={colors.textPrimary} fontSize="lg" fontWeight="semibold">
                      Achievements
                    </Text>
                  </HStack>
                  <Feather 
                    name={achievementsExpanded ? "chevron-up" : "chevron-down"} 
                    size={20} 
                    color={colors.textSecondary} 
                  />
                </HStack>
              </Box>
            </Pressable>

            {achievementsExpanded && (
              <Box p={4} pt={0}>
                {loadingAchievements ? (
                  <Center py={8}>
                    <Spinner size="lg" color={colors.primary} />
                    <Text color={colors.textSecondary} mt={4}>
                      Loading achievements...
                    </Text>
                  </Center>
                ) : achievements.length > 0 ? (
                  <Box mt={4}>
                    <AchievementBoard achievements={achievements} />
                  </Box>
                ) : (
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
            <Pressable onPress={() => setCollectionsExpanded(!collectionsExpanded)}>
              <Box
                p={4}
                bg={collectionsExpanded ? colors.backgroundElevated : colors.backgroundCard}
              >
                <HStack justifyContent="space-between" alignItems="center">
                  <HStack alignItems="center" space={2}>
                    <Feather name="folder" size={20} color={colors.primary} />
                    <Text color={colors.textPrimary} fontSize="lg" fontWeight="semibold">
                      Collections
                    </Text>
                    <Badge
                      bg={colors.primaryFocus}
                      borderRadius="full"
                      px={2}
                      py={0.5}
                    >
                      <Text fontSize="xs" color={colors.textSecondary}>
                        {collections.length} {collections.length === 1 ? 'collection' : 'collections'}
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
                {loadingCollections ? (
                  <Center py={8}>
                    <Spinner size="lg" color={colors.primary} />
                    <Text color={colors.textSecondary} mt={4}>
                      Loading collections...
                    </Text>
                  </Center>
                ) : collections.length === 0 ? (
                  <Center py={8}>
                    <Text color={colors.textSecondary} textAlign="center">
                      No collections yet
                    </Text>
                    <Text color={colors.textTertiary} fontSize="sm" textAlign="center" mt={2}>
                      Create your first collection to organize your favorite devices.
                    </Text>
                  </Center>
                ) : (
                  <VStack space={4} mt={4}>
                    {collections.map((collection) => {
                      const displayDevices = collection.devices.slice(0, 4);
                      return (
                        <Pressable
                          key={collection.id}
                          onPress={() => router.push(`/collections/${collection.id}`)}
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
                              <Text color={colors.textPrimary} fontSize="md" fontWeight="semibold">
                                {collection.name}
                              </Text>
                              <Badge
                                bg={colors.primaryFocus}
                                borderRadius="full"
                                px={2}
                                py={0.5}
                                alignSelf="flex-start"
                              >
                                <Text fontSize="xs" color={colors.textSecondary}>
                                  {collection.deviceCount} {collection.deviceCount === 1 ? 'device' : 'devices'}
                                </Text>
                              </Badge>
                              {collection.description && (
                                <Text color={colors.textSecondary} fontSize="sm">
                                  {collection.description}
                                </Text>
                              )}
                            </VStack>

                              {displayDevices.length > 0 ? (
                                <VStack space={2}>
                                  {Array.from({ length: Math.ceil(displayDevices.length / 2) }).map((_, rowIndex) => (
                                    <HStack key={rowIndex} space={2} width="100%">
                                      {displayDevices
                                        .slice(rowIndex * 2, rowIndex * 2 + 2)
                                        .map((device) => (
                                          <Box key={device.id} flex={1} height={180}>
                                            <DeviceCard
                                              device={device}
                                              onPress={() => router.push(`/devices/${device.name.sanitized}`)}
                                              imageOnly={true}
                                            />
                                          </Box>
                                        ))}
                                      {/* Fill empty slot if odd number of items */}
                                      {displayDevices.slice(rowIndex * 2, rowIndex * 2 + 2).length === 1 && (
                                        <Box flex={1} />
                                      )}
                                    </HStack>
                                  ))}
                                </VStack>
                              ) : (
                                <Text color={colors.textTertiary} fontSize="sm" textAlign="center" py={2}>
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

          {/* Sign Out Button */}
          <Button
            onPress={() => {
              signOut();
              router.replace('/(tabs)/profile');
            }}
            bg={colors.backgroundCard}
            borderWidth={1}
            borderColor={colors.border}
            _pressed={{ bg: colors.backgroundElevated }}
            size="md"
            width="100%"
            maxW="200px"
            mt={4}
          >
            <Text color={colors.textPrimary}>Sign Out</Text>
          </Button>
          </VStack>
        </ScrollView>
      </Box>
    </GestureDetector>
  );
}
