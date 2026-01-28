import React, { useState, useEffect } from 'react';
import { Box, Text, Center, Button, VStack, HStack, Spinner, ScrollView } from 'native-base';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { GestureDetector, Gesture } from 'react-native-gesture-handler';
import { useAuth } from '../../contexts/AuthContext';
import { colors } from '../../theme/colors';
import { AchievementService } from '../../services/achievements/achievement.service';
import { buildAchievementBoard } from '../../services/achievements/achievement.helpers';
import { AchievementStatus } from '../../types/achievement.contract';
import { AchievementBoard } from '../../components/achievements/AchievementBoard';

export default function ProfilePage() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user, loading, authenticated, signOut } = useAuth();
  const [achievements, setAchievements] = useState<AchievementStatus[]>([]);
  const [loadingAchievements, setLoadingAchievements] = useState(true);
  const [checkingAchievements, setCheckingAchievements] = useState(false);
  const [achievementService] = useState(() => new AchievementService());

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

  useEffect(() => {
    if (authenticated && user) {
      loadAchievements();
    }
  }, [authenticated, user]);

  const loadAchievements = async () => {
    if (!user) return;

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
  };

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

          {/* Achievements Section */}
          {loadingAchievements ? (
            <Center py={8}>
              <Spinner size="lg" color={colors.primary} />
              <Text color={colors.textSecondary} mt={4}>
                Loading achievements...
              </Text>
            </Center>
          ) : (
            <VStack space={4}>
              <HStack justifyContent="space-between" alignItems="center">
                <Text color={colors.textPrimary} fontSize="lg" fontWeight="semibold">
                  Achievements
                </Text>
                <Button
                  onPress={handleCheckAchievements}
                  bg={colors.primary}
                  _pressed={{ bg: colors.primaryHover }}
                  size="sm"
                  isLoading={checkingAchievements}
                  isDisabled={checkingAchievements}
                >
                  <Text color={colors.textPrimary} fontSize="xs">
                    Check
                  </Text>
                </Button>
              </HStack>

              {achievements.length > 0 ? (
                <AchievementBoard achievements={achievements} />
              ) : (
                <Center py={8}>
                  <Text color={colors.textSecondary}>
                    No achievements available
                  </Text>
                </Center>
              )}
            </VStack>
          )}

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
