import React from "react";
import {
  Badge,
  Box,
  HStack,
  Image,
  Pressable,
  Text,
  VStack,
} from "native-base";
import { LinearGradient } from "expo-linear-gradient";
import { Feather, Ionicons } from "@expo/vector-icons";
import { Device } from "../../types/device.model";
import { useAuth } from "../../contexts/AuthContext";
import { getDeviceImageUrl } from "../../services/devices/device.service";
import { EmulationBadge } from "../devices/EmulationBadge";
import {
  getUptoSystemA,
  getUptoSystemCOrLower,
} from "../../utils/device-helpers";
import { colors } from "../../theme/colors";

interface DeviceCardProps {
  device: Device;
  onPress?: () => void;
  imageOnly?: boolean;
  isFavorited?: boolean;
  onToggleFavorite?: () => void;
}

export function DeviceCard(
  {
    device,
    onPress,
    imageOnly = false,
    isFavorited = false,
    onToggleFavorite,
  }: DeviceCardProps,
) {
  const { authenticated } = useAuth();
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
      low: "$",
      mid: "$$",
      high: "$$$",
    };
    return (
      <Badge
        bg={categoryColors[device.pricing.category] || colors.primary}
        borderRadius="full"
        px={2}
        py={0.5}
      >
        <Text fontSize="xs" color={colors.textPrimary}>
          {categoryLabels[device.pricing.category] ||
            device.pricing.category.toUpperCase()}
        </Text>
      </Badge>
    );
  };

  const content = imageOnly
    ? (
      <Box
        bg={colors.backgroundCard}
        borderRadius="md"
        borderWidth={1}
        borderColor={colors.primary}
        overflow="hidden"
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
            p={2}
          />
        </Box>
      </Box>
    )
    : (
      <Box
        bg={colors.backgroundCard}
        borderRadius="md"
        borderWidth={1}
        borderColor={isFavorited ? colors.favorite : colors.primary}
        overflow="hidden"
        height="100%"
      >
        <VStack space={0} flex={1} height="100%">
          <Box
            position="relative"
            flex={1}
            minHeight={150}
            bg={colors.backgroundElevated}
            p={2}
          >
            <Image
              source={{ uri: imageUrl }}
              alt={device.name.raw}
              width="full"
              height="100%"
              resizeMode="contain"
            />
            {/* Top fade overlay - smooth gradient */}
            <Box
              position="absolute"
              top={0}
              left={0}
              right={0}
              height="60px"
              pointerEvents="none"
            >
              <LinearGradient
                colors={["rgba(0,0,0,0.7)", "rgba(0,0,0,0.4)", "transparent"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 0, y: 1 }}
                style={{ width: "100%", height: "100%" }}
              />
            </Box>
            {/* Bottom fade overlay - smooth gradient */}
            <Box
              position="absolute"
              bottom={0}
              left={0}
              right={0}
              height="60px"
              pointerEvents="none"
            >
              <LinearGradient
                colors={["transparent", "rgba(0,0,0,0.4)", "rgba(0,0,0,0.7)"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 0, y: 1 }}
                style={{ width: "100%", height: "100%" }}
              />
            </Box>
            <Box position="absolute" top={2} left={2} right={2} zIndex={1}>
              <HStack space={1} alignItems="center" flexWrap="wrap">
                {getCategoryBadge()}
                {(() => {
                  const upToSystemA = getUptoSystemA(device);
                  const upToSystemC = getUptoSystemCOrLower(device);
                  const badges = [];

                  if (upToSystemA) {
                    badges.push(
                      <EmulationBadge
                        key="upToA"
                        rating={upToSystemA}
                        type="upToA"
                      />,
                    );
                  }
                  if (upToSystemC) {
                    badges.push(
                      <EmulationBadge
                        key="upToC"
                        rating={upToSystemC}
                        type="upToC"
                      />,
                    );
                  }
                  return badges;
                })()}
              </HStack>
            </Box>
            <Box position="absolute" bottom={2} left={2} right={2} zIndex={1}>
              <HStack justifyContent="flex-start" alignItems="center">
                {getPriceDisplay()}
              </HStack>
            </Box>
            {authenticated && (
              <Box position="absolute" top={2} right={2} zIndex={1}>
                {onToggleFavorite
                  ? (
                    <Pressable
                      onPress={(e) => {
                        e.stopPropagation();
                        onToggleFavorite();
                      }}
                      hitSlop={8}
                      p={1}
                    >
                      <Ionicons
                        name={isFavorited ? "heart" : "heart-outline"}
                        size={20}
                        color={colors.favorite}
                      />
                    </Pressable>
                  )
                  : (
                    <Ionicons
                      name={isFavorited ? "heart" : "heart-outline"}
                      size={20}
                      color={colors.favorite}
                    />
                  )}
              </Box>
            )}
          </Box>

          <VStack space={1} p={3}>
            <Text
              fontSize="sm"
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
