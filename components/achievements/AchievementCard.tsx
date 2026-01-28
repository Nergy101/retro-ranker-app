import React from 'react';
import { Box, VStack, HStack, Text, Progress } from 'native-base';
import { AchievementStatus } from '../../types/achievement.contract';
import { colors } from '../../theme/colors';

interface AchievementCardProps {
  achievement: AchievementStatus;
}

export function AchievementCard({ achievement }: AchievementCardProps) {
  const isUnlocked = achievement.unlocked;

  return (
    <Box
      bg={colors.backgroundCard}
      borderWidth={1}
      borderColor={isUnlocked ? colors.primary : colors.border}
      borderRadius="md"
      p={4}
      opacity={isUnlocked ? 1 : 0.7}
    >
      <VStack space={3}>
        {/* Icon and Category */}
        <HStack space={3} alignItems="center">
          <Box
            bg={isUnlocked ? colors.primary : colors.backgroundElevated}
            borderRadius="full"
            width={12}
            height={12}
            justifyContent="center"
            alignItems="center"
          >
            <Text fontSize="2xl">{achievement.icon}</Text>
          </Box>
          <VStack flex={1} space={1}>
            <Text
              fontSize="xs"
              color={colors.textTertiary}
              textTransform="uppercase"
              fontWeight="semibold"
            >
              {achievement.category}
            </Text>
            <Text
              fontSize="lg"
              fontWeight="bold"
              color={isUnlocked ? colors.textPrimary : colors.textSecondary}
            >
              {achievement.name}
            </Text>
          </VStack>
        </HStack>

        {/* Description */}
        <Text fontSize="sm" color={colors.textSecondary}>
          {achievement.description}
        </Text>

        {/* Progress */}
        <VStack space={2}>
          <Progress
            value={achievement.progressPercentage}
            bg={colors.backgroundElevated}
            _filledTrack={{
              bg: isUnlocked ? colors.primary : colors.textTertiary,
            }}
            size="sm"
          />
          <HStack justifyContent="space-between" alignItems="center">
            <Text fontSize="xs" color={colors.textTertiary}>
              {achievement.progressLabel}
            </Text>
            <Text
              fontSize="xs"
              color={isUnlocked ? colors.primary : colors.textSecondary}
              fontWeight={isUnlocked ? 'semibold' : 'normal'}
            >
              {achievement.statusText}
            </Text>
          </HStack>
        </VStack>
      </VStack>
    </Box>
  );
}
