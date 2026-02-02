import React, { useCallback, useState } from "react";
import {
  Badge,
  Box,
  HStack,
  Image,
  Pressable,
  Text,
  VStack,
} from "native-base";
import { Feather, Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { Device } from "../../types/device.model";
import { Ranking } from "../../services/devices/ranking.service";
import { getDeviceImageUrl } from "../../services/devices/device.service";
import { DeviceCollectionService } from "../../services/devices/device-collection.service";
import { useAuth } from "../../contexts/AuthContext";
import { useFavoritedDeviceIds } from "../../hooks/useFavoritedDeviceIds";
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
  const { user, authenticated } = useAuth();
  const { favoritedDeviceIds, refetch } = useFavoritedDeviceIds();
  const [togglingFavorite, setTogglingFavorite] = useState(false);
  const [optimisticFavorited, setOptimisticFavorited] = useState<
    boolean | null
  >(
    null,
  );

  const deviceCollectionService = DeviceCollectionService.getInstance();
  const imageUrl = getDeviceImageUrl(device);

  const isFavorited = optimisticFavorited ?? favoritedDeviceIds.has(device.id);

  const handleToggleFavorite = useCallback(async () => {
    if (!user?.id || togglingFavorite) return;
    const currentFavorited = optimisticFavorited ??
      favoritedDeviceIds.has(device.id);
    const nextFavorited = !currentFavorited;
    setOptimisticFavorited(nextFavorited);
    setTogglingFavorite(true);
    try {
      if (currentFavorited) {
        await deviceCollectionService.removeFavorite(user.id, device.id);
      } else {
        await deviceCollectionService.addFavorite(user.id, device.id);
      }
      await refetch();
      setOptimisticFavorited(null);
    } catch (err) {
      console.error("Error toggling favorite:", err);
      setOptimisticFavorited(currentFavorited);
    } finally {
      setTogglingFavorite(false);
    }
  }, [
    user?.id,
    device.id,
    togglingFavorite,
    optimisticFavorited,
    favoritedDeviceIds,
    refetch,
  ]);

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
            {authenticated && (
              <Box position="absolute" top={3} right={3} zIndex={1}>
                <Pressable
                  onPress={(e) => {
                    e.stopPropagation();
                    handleToggleFavorite();
                  }}
                  disabled={togglingFavorite}
                  hitSlop={8}
                  p={2}
                  borderRadius="full"
                  bg={colors.backgroundCard}
                  borderWidth={1}
                  borderColor={colors.border}
                  _pressed={{ opacity: 0.8 }}
                >
                  <Ionicons
                    name={isFavorited ? "heart" : "heart-outline"}
                    size={24}
                    color={colors.favorite}
                  />
                </Pressable>
              </Box>
            )}
          </Box>
        </Pressable>

        {/* Device Info Section */}
        <Box p={4} bg={colors.backgroundCard}>
          <VStack space={2}>
            <HStack space={2} alignItems="baseline" flexWrap="wrap">
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
            </HStack>
            <Text fontSize="sm" color={colors.textSecondary} mt={1}>
              RetroRanker score: {device.totalRating}/10
              {device.pricing.average != null &&
                device.totalRating > 0 && (
                  <>
                    {" – "}
                    {`$${(
                      Number(device.pricing.average) / device.totalRating
                    ).toFixed(0)}`}
                    {" per point"}
                  </>
                )}
            </Text>
            <HStack
              alignItems="center"
              justifyContent="space-between"
              mt={1}
              flexWrap="wrap"
            >
              {device.pricing.average
                ? (
                  <HStack alignItems="center" space={0}>
                    <Feather
                      name="dollar-sign"
                      size={16}
                      color={colors.primary}
                    />
                    <Text
                      fontSize="md"
                      color={colors.primary}
                      fontWeight="semibold"
                    >
                      {device.pricing.average}
                    </Text>
                  </HStack>
                )
                : <Box flex={1} />}
              <Pressable
                onPress={() =>
                  router.push(`/devices/${device.name.sanitized}`)}
                borderWidth={1}
                borderColor={colors.primary}
                borderRadius="md"
                px={3}
                py={1.5}
              >
                <Text
                  fontSize="xs"
                  color={colors.primary}
                  fontWeight="medium"
                >
                  Details
                </Text>
              </Pressable>
            </HStack>
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
