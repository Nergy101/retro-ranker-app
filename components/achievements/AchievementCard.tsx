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
            flexShrink={0}
            justifyContent="center"
            alignItems="center"
          >
            <Text fontSize="2xl">{achievement.icon}</Text>
          </Box>
          <VStack flex={1} flexShrink={1} space={1}>
            <Text
              fontSize="xs"
              color={colors.textTertiary}
              textTransform="uppercase"
              fontWeight="semibold"
              numberOfLines={1}
            >
              {achievement.category}
            </Text>
            <Text
              fontSize="md"
              fontWeight="bold"
              color={isUnlocked ? colors.textPrimary : colors.textSecondary}
              numberOfLines={2}
            >
              {achievement.name}
            </Text>
          </VStack>
        </HStack>

        {/* Description */}
        <Text fontSize="sm" color={colors.textSecondary} numberOfLines={3}>
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
          <HStack justifyContent="space-between" alignItems="center" space={2}>
            <Text
              fontSize="xs"
              color={colors.textTertiary}
              flex={1}
              numberOfLines={1}
            >
              {achievement.progressLabel}
            </Text>
            <Text
              fontSize="xs"
              color={isUnlocked ? colors.primary : colors.textSecondary}
              fontWeight={isUnlocked ? 'semibold' : 'normal'}
              flexShrink={0}
              numberOfLines={1}
            >
              {achievement.statusText}
            </Text>
          </HStack>
        </VStack>
      </VStack>
    </Box>
  );
}
