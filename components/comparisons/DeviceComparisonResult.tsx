import React from 'react';
import { Box, VStack, HStack, Text, Image, Badge } from 'native-base';
import { Feather } from '@expo/vector-icons';
import { Device } from '../../types/device.model';
import { Ranking } from '../../services/devices/ranking.service';
import { getDeviceImageUrl } from '../../services/devices/device.service';
import { colors } from '../../theme/colors';
import { SpecSummary } from '../specifications/SpecSummary';

interface DeviceComparisonResultProps {
  device: Device;
  ranking: Ranking;
}

export function DeviceComparisonResult({ device, ranking }: DeviceComparisonResultProps) {
  const imageUrl = getDeviceImageUrl(device);

  const getRankingClass = (categoryName: keyof Ranking): string => {
    const categoryRanking = ranking[categoryName];
    if (!categoryRanking || categoryRanking.length === 0) return '';

    if (categoryRanking[0] === 'equal') {
      return 'equal';
    }

    return categoryRanking[0] === device.name.sanitized ? 'better' : 'worse';
  };

  const getRankingColor = (categoryName: keyof Ranking): string => {
    const rankingClass = getRankingClass(categoryName);
    switch (rankingClass) {
      case 'better':
        return colors.success; // Green
      case 'worse':
        return colors.error; // Red
      case 'equal':
        return colors.info; // Blue
      default:
        return colors.border;
    }
  };

  return (
    <Box bg={colors.backgroundCard} p={4} borderRadius="md" mb={4} flex={1}>
      <VStack space={4}>
        {/* Device Header */}
        <Box>
          <Image
            source={{ uri: imageUrl }}
            alt={device.name.raw}
            width="full"
            height={200}
            resizeMode="contain"
            bg={colors.backgroundElevated}
            borderRadius="md"
            mb={3}
          />
          <Text fontSize="2xl" fontWeight="bold" color={colors.textPrimary} mb={1}>
            {device.brand.raw} {device.name.raw}
          </Text>
          {device.pricing.average && (
            <HStack alignItems="center" space={1}>
              <Feather name="dollar-sign" size={18} color={colors.primary} />
              <Text fontSize="lg" color={colors.primary} fontWeight="semibold">
                {device.pricing.average}
              </Text>
            </HStack>
          )}
        </Box>

        {/* Ranking Badges */}
        <VStack space={2}>
          <Text fontSize="md" fontWeight="bold" color={colors.textPrimary} mb={2}>
            Rankings
          </Text>
          <HStack space={2} flexWrap="wrap">
            {(['all', 'emuPerformance', 'monitor', 'dimensions', 'connectivity', 'audio', 'controls', 'misc'] as const).map((category) => {
              const color = getRankingColor(category);
              const label = category === 'emuPerformance' ? 'Performance' :
                           category === 'all' ? 'Overall' :
                           category.charAt(0).toUpperCase() + category.slice(1);
              
              return (
                <Badge
                  key={category}
                  bg={color}
                  borderRadius="full"
                  px={3}
                  py={1}
                  mb={2}
                  mr={2}
                >
                  <Text fontSize="xs" color={colors.textPrimary} fontWeight="semibold">
                    {label}
                  </Text>
                </Badge>
              );
            })}
          </HStack>
        </VStack>

        {/* Spec Summary */}
        <SpecSummary device={device} />
      </VStack>
    </Box>
  );
}
