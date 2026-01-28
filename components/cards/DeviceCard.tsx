import React from 'react';
import { Box, Text, Image, HStack, VStack, Badge, Pressable } from 'native-base';
import { Feather } from '@expo/vector-icons';
import { Device } from '../../types/device.model';
import { getDeviceImageUrl } from '../../services/devices/device.service';
import { EmulationBadge } from '../devices/EmulationBadge';
import { getUptoSystemA, getUptoSystemCOrLower } from '../../utils/device-helpers';
import { colors } from '../../theme/colors';

interface DeviceCardProps {
  device: Device;
  onPress?: () => void;
  imageOnly?: boolean;
}

export function DeviceCard({ device, onPress, imageOnly = false }: DeviceCardProps) {
  const imageUrl = getDeviceImageUrl(device);
  
  // Calculate appropriate font size based on title length
  const getTitleFontSize = () => {
    const title = `${device.brand.raw} ${device.name.raw}`;
    const length = title.length;
    
    // Scale down font size for longer titles to fit better
    if (length > 50) return 10; // Very small for very long titles (10px)
    if (length > 35) return 11; // Small for long titles (11px)
    if (length > 25) return 12; // Small for medium-long titles (12px)
    return 'sm'; // Default size for normal titles
  };
  
  const getPriceDisplay = () => {
    if (device.pricing.discontinued) {
      return <Text fontSize="xs" color={colors.textTertiary}>Discontinued</Text>;
    }
    if (device.pricing.range) {
      const { min, max } = device.pricing.range;
      if (min === max) {
        return (
          <HStack alignItems="center" space={1}>
            <Feather name="dollar-sign" size={12} color={colors.primary} />
            <Text fontSize="xs" color={colors.primary} fontWeight="bold">
              {min}
            </Text>
          </HStack>
        );
      }
      return (
        <HStack alignItems="center" space={1}>
          <Feather name="dollar-sign" size={12} color={colors.primary} />
          <Text fontSize="xs" color={colors.primary} fontWeight="bold">
            {min} - {max}
          </Text>
        </HStack>
      );
    }
    return null;
  };

  const getCategoryBadge = () => {
    if (!device.pricing.category) return null;
    const categoryColors: Record<string, string> = {
      low: colors.success,
      mid: colors.primary,
      high: colors.error,
    };
    const categoryLabels: Record<string, string> = {
      low: '$',
      mid: '$$',
      high: '$$$',
    };
    return (
      <Badge
        bg={categoryColors[device.pricing.category] || colors.primary}
        borderRadius="full"
        px={2}
        py={0.5}
      >
        <Text fontSize="xs" color={colors.textPrimary}>
          {categoryLabels[device.pricing.category] || device.pricing.category.toUpperCase()}
        </Text>
      </Badge>
    );
  };

  const content = imageOnly ? (
    <Box
      bg={colors.backgroundCard}
      borderRadius="md"
      borderWidth={1}
      borderColor={colors.border}
      p={2}
      height="100%"
    >
      <Box flex={1} width="full" height="100%">
        <Image
          source={{ uri: imageUrl }}
          alt={device.name.raw}
          width="full"
          height="100%"
          resizeMode="contain"
          bg={colors.backgroundElevated}
          borderRadius="md"
        />
      </Box>
    </Box>
  ) : (
    <Box
      bg={colors.backgroundCard}
      borderRadius="md"
      borderWidth={1}
      borderColor={colors.border}
      p={3}
      height="100%"
    >
      <VStack space={2} flex={1} height="100%">
        <Box position="relative" flex={1} minHeight={150}>
          <Image
            source={{ uri: imageUrl }}
            alt={device.name.raw}
            width="full"
            height="100%"
            resizeMode="contain"
            bg={colors.backgroundElevated}
            borderRadius="md"
          />
          <Box position="absolute" top={2} left={2} right={2}>
            <HStack space={1} alignItems="center" flexWrap="wrap">
              {getCategoryBadge()}
              {(() => {
                const upToSystemA = getUptoSystemA(device);
                const upToSystemC = getUptoSystemCOrLower(device);
                const badges = [];
                
                if (upToSystemA) {
                  badges.push(
                    <EmulationBadge key="upToA" rating={upToSystemA} type="upToA" />
                  );
                }
                if (upToSystemC) {
                  badges.push(
                    <EmulationBadge key="upToC" rating={upToSystemC} type="upToC" />
                  );
                }
                return badges;
              })()}
            </HStack>
          </Box>
        </Box>
        
        <VStack space={1}>
          <Text fontSize={getTitleFontSize()} fontWeight="bold" color={colors.textPrimary} numberOfLines={2}>
            {device.brand.raw} {device.name.raw}
          </Text>
          
          <VStack space={0.5}>
            {getPriceDisplay()}
          </VStack>
        </VStack>
      </VStack>
    </Box>
  );

  if (onPress) {
    return (
      <Pressable onPress={onPress}>
        {content}
      </Pressable>
    );
  }

  return content;
}
