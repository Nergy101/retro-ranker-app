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
import { Feather } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { Device } from "../../types/device.model";
import { Ranking } from "../../services/devices/ranking.service";
import { getDeviceImageUrl } from "../../services/devices/device.service";
import { colors } from "../../theme/colors";
import { SpecSummary } from "../specifications/SpecSummary";

interface DeviceComparisonResultProps {
  device: Device;
  ranking: Ranking;
}

export function DeviceComparisonResult(
  { device, ranking }: DeviceComparisonResultProps,
) {
  const router = useRouter();
  const imageUrl = getDeviceImageUrl(device);

  const getRankingClass = (categoryName: keyof Ranking): string => {
    const categoryRanking = ranking[categoryName];
    if (!categoryRanking || categoryRanking.length === 0) return "";

    if (categoryRanking[0] === "equal") {
      return "equal";
    }

    return categoryRanking[0] === device.name.sanitized ? "better" : "worse";
  };

  const getRankingColor = (categoryName: keyof Ranking): string => {
    const rankingClass = getRankingClass(categoryName);
    switch (rankingClass) {
      case "better":
        return colors.success; // Green
      case "worse":
        return colors.error; // Red
      case "equal":
        return colors.info; // Blue
      default:
        return colors.border;
    }
  };

  return (
    <Box
      bg={colors.backgroundCard}
      borderRadius="md"
      borderWidth={1}
      borderColor={colors.border}
      mb={4}
      flex={1}
      overflow="hidden"
      shadow={1}
    >
      <VStack space={0}>
        {/* Device Image Section */}
        <Pressable
          onPress={() => router.push(`/devices/${device.name.sanitized}`)}
        >
          <Box bg={colors.backgroundElevated} p={4} position="relative">
            <Image
              source={{ uri: imageUrl }}
              alt={device.name.raw}
              width="full"
              height={250}
              resizeMode="contain"
              p={2}
            />
          </Box>
        </Pressable>

        {/* Device Info Section */}
        <Box p={4} bg={colors.backgroundCard}>
          <VStack space={2}>
            <Text
              fontSize="xl"
              fontWeight="bold"
              color={colors.textPrimary}
              numberOfLines={1}
              isTruncated
            >
              {device.name.raw}
            </Text>
            <Text
              fontSize="sm"
              color={colors.textSecondary}
              numberOfLines={1}
              isTruncated
            >
              {device.brand.raw}
            </Text>
            {device.pricing.average && (
              <HStack alignItems="center" space={1} mt={1}>
                <Feather name="dollar-sign" size={16} color={colors.primary} />
                <Text
                  fontSize="md"
                  color={colors.primary}
                  fontWeight="semibold"
                >
                  {device.pricing.average}
                </Text>
              </HStack>
            )}
          </VStack>
        </Box>

        {/* Rankings Section */}
        <Box
          p={4}
          bg={colors.background}
          borderTopWidth={1}
          borderTopColor={colors.border}
        >
          <VStack space={3}>
            <Text
              fontSize="sm"
              fontWeight="bold"
              color={colors.textSecondary}
              textTransform="uppercase"
              letterSpacing={0.5}
            >
              Rankings
            </Text>
            <HStack space={2} flexWrap="wrap">
              {([
                "all",
                "emuPerformance",
                "monitor",
                "dimensions",
                "connectivity",
                "audio",
                "controls",
                "misc",
              ] as const).map((category) => {
                const color = getRankingColor(category);
                const label = category === "emuPerformance"
                  ? "Performance"
                  : category === "all"
                  ? "Overall"
                  : category.charAt(0).toUpperCase() + category.slice(1);

                return (
                  <Badge
                    key={category}
                    bg={color}
                    borderRadius="full"
                    px={3}
                    py={1.5}
                    mb={1}
                  >
                    <Text
                      fontSize="xs"
                      color="white"
                      fontWeight="bold"
                    >
                      {label}
                    </Text>
                  </Badge>
                );
              })}
            </HStack>
          </VStack>
        </Box>

        {/* Spec Summary Section */}
        <Box
          p={4}
          bg={colors.backgroundCard}
          borderTopWidth={1}
          borderTopColor={colors.border}
        >
          <SpecSummary device={device} />
        </Box>
      </VStack>
    </Box>
  );
}
