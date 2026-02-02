import React from "react";
import { Box, HStack, Image, Pressable, Text, VStack } from "native-base";
import { Feather } from "@expo/vector-icons";
import { Device } from "../../types/device.model";
import { getDeviceImageUrl } from "../../services/devices/device.service";
import { colors } from "../../theme/colors";
import { TagComponent } from "../shared/TagComponent";

interface DeviceCardRowProps {
  device: Device;
  onPress?: () => void;
  isLoggedIn?: boolean;
  likes?: number;
  isLiked?: boolean;
  isFavorited?: boolean;
}

export function DeviceCardRow({
  device,
  onPress,
  isLoggedIn = false,
  likes = 0,
  isLiked = false,
  isFavorited = false,
}: DeviceCardRowProps) {
  const imageUrl = getDeviceImageUrl(device);

  const getPriceDisplay = () => {
    if (device.pricing.discontinued) {
      return (
        <Text fontSize="xs" color={colors.textTertiary}>Discontinued</Text>
      );
    }
    if (device.pricing.range) {
      const { min, max } = device.pricing.range;
      if (min === max) {
        return (
          <HStack alignItems="center" space={0}>
            <Feather name="dollar-sign" size={14} color={colors.primary} />
            <Text fontSize="sm" color={colors.primary} fontWeight="bold">
              {min}
            </Text>
          </HStack>
        );
      }
      return (
        <HStack alignItems="center" space={0}>
          <Feather name="dollar-sign" size={14} color={colors.primary} />
          <Text fontSize="sm" color={colors.primary} fontWeight="bold">
            {min} - {max}
          </Text>
        </HStack>
      );
    }
    return null;
  };

  const content = (
    <Box
      bg={colors.backgroundCard}
      borderRadius="md"
      borderWidth={1}
      borderColor={isFavorited ? colors.favorite : colors.primary}
      overflow="hidden"
      mb={2}
    >
      <HStack space={0} alignItems="stretch">
        <Box bg={colors.backgroundElevated} p={3}>
          <Image
            source={{ uri: imageUrl }}
            alt={device.name.raw}
            width={80}
            height={80}
            resizeMode="contain"
          />
        </Box>

        <VStack flex={1} space={1} p={3}>
          <Text
            fontSize="md"
            fontWeight="bold"
            color={colors.textPrimary}
            numberOfLines={1}
            isTruncated
          >
            {device.name.raw}
          </Text>
          <Text
            fontSize="xs"
            color={colors.textSecondary}
            numberOfLines={1}
            isTruncated
          >
            {device.brand.raw}
          </Text>

          <HStack space={2} alignItems="center" flexWrap="wrap">
            <Text fontSize="xs" color={colors.textSecondary}>
              ⭐ {device.totalRating.toFixed(1)}/10
            </Text>
            {getPriceDisplay()}
          </HStack>

          {device.tags && device.tags.length > 0 && (
            <HStack space={1} flexWrap="wrap" mt={1}>
              {device.tags.slice(0, 2).map((tag) => (
                <TagComponent key={tag.id} tag={tag} size="xs" />
              ))}
            </HStack>
          )}
        </VStack>
      </HStack>
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
