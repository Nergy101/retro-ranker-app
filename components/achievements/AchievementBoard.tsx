import React from 'react';
import { Box, VStack, HStack, Text, ScrollView, Pressable } from 'native-base';
import { AchievementStatus } from '../../types/achievement.contract';
import { AchievementCard } from './AchievementCard';
import { colors } from '../../theme/colors';

interface AchievementBoardProps {
  achievements: AchievementStatus[];
}

export function AchievementBoard({ achievements }: AchievementBoardProps) {
  const unlockedAchievements = achievements.filter((a) => a.unlocked);
  const lockedAchievements = achievements.filter((a) => !a.unlocked);

  // Group by category
  const groupByCategory = (achievements: AchievementStatus[]) => {
    const grouped: Record<string, AchievementStatus[]> = {};
    achievements.forEach((achievement) => {
      if (!grouped[achievement.category]) {
        grouped[achievement.category] = [];
      }
      grouped[achievement.category].push(achievement);
    });
    return grouped;
  };

  const lockedByCategory = groupByCategory(lockedAchievements);
  const unlockedByCategory = groupByCategory(unlockedAchievements);

  return (
    <ScrollView>
      <VStack space={6} p={4}>
        {/* Summary */}
        <Box
          bg={colors.backgroundCard}
          borderRadius="md"
          p={4}
          borderWidth={1}
          borderColor={colors.border}
        >
          <HStack justifyContent="space-between" alignItems="center">
            <Text fontSize="lg" fontWeight="bold" color={colors.textPrimary}>
              Achievements
            </Text>
            <Text fontSize="md" color={colors.textSecondary}>
              {unlockedAchievements.length} / {achievements.length}
            </Text>
          </HStack>
          <Text fontSize="sm" color={colors.textTertiary} mt={2}>
            Collect playful emblems as you explore Retro Ranker.
          </Text>
        </Box>

        {/* Locked Achievements */}
        {Object.entries(lockedByCategory).map(([category, categoryAchievements]) => (
          <VStack key={`locked-${category}`} space={3}>
            <Text
              fontSize="md"
              fontWeight="semibold"
              color={colors.textPrimary}
              textTransform="uppercase"
            >
              {category} - Locked
            </Text>
            <VStack space={3}>
              {categoryAchievements.map((achievement) => (
                <AchievementCard key={achievement.id} achievement={achievement} />
              ))}
            </VStack>
          </VStack>
        ))}

        {/* Unlocked Achievements */}
        {unlockedAchievements.length > 0 && (
          <VStack space={3}>
            <Text
              fontSize="md"
              fontWeight="semibold"
              color={colors.primary}
              textTransform="uppercase"
            >
              Unlocked ({unlockedAchievements.length})
            </Text>
            <VStack space={3}>
              {unlockedAchievements.map((achievement) => (
                <AchievementCard key={achievement.id} achievement={achievement} />
              ))}
            </VStack>
          </VStack>
        )}
      </VStack>
    </ScrollView>
  );
}
