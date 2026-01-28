import { Feather } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import {
  Box,
  Center,
  HStack,
  Image,
  Pressable,
  ScrollView,
  Spinner,
  Text,
  VStack,
} from "native-base";
import React, { useEffect, useState } from "react";
import { Dimensions, StyleSheet, View } from "react-native";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { DeviceCard } from "../../components/cards/DeviceCard";
import { RateLimitError } from "../../components/errors/RateLimitError";
import { DeviceService } from "../../services/devices/device.service";
import { colors } from "../../theme/colors";
import { Device } from "../../types/device.model";
import { getErrorMessage, getRateLimitInfo } from "../../utils/error-utils";

export default function HomePage() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const screenWidth = Dimensions.get("window").width;
  const deviceService = DeviceService.getInstance();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [rateLimitError, setRateLimitError] = useState<
    {
      retryAfterMinutes: number;
    } | null
  >(null);
  const [newArrivals, setNewArrivals] = useState<Device[]>([]);
  const [bangForYourBuck, setBangForYourBuck] = useState<Device[]>([]);
  const [personalPicks, setPersonalPicks] = useState<Device[]>([]);
  const [personalPickTagId, setPersonalPickTagId] = useState<string | null>(
    null,
  );

  // Calculate card width for 2-column grid with gaps
  const cardGap = 12;
  const horizontalPadding = 16; // 16px on each side
  const totalPadding = horizontalPadding * 2; // 32px total
  const availableWidth = screenWidth - totalPadding;
  const cardWidth = Math.floor((availableWidth - cardGap) / 2);
  const safeCardWidth = cardWidth > 0 ? cardWidth : 150;

  useEffect(() => {
    loadInitialData();
  }, []);

  const loadInitialData = async () => {
    try {
      setLoading(true);

      // Load all device sections in parallel and get personal-pick tag
      const [arrivals, bang, picks, personalPickTag] = await Promise.all([
        deviceService.getNewArrivals(),
        deviceService.getBangForYourBuck(),
        deviceService.getPersonalPicks(),
        deviceService.getTagBySlug("personal-pick"),
      ]);

      setNewArrivals(arrivals);
      setBangForYourBuck(bang);
      setPersonalPicks(picks);
      if (personalPickTag) {
        setPersonalPickTagId(personalPickTag.id);
      }

      // Clear any previous errors on successful load
      setRateLimitError(null);
      setError(null);
    } catch (err) {
      const rateLimitInfo = getRateLimitInfo(err);
      if (rateLimitInfo) {
        setRateLimitError({
          retryAfterMinutes: rateLimitInfo.retryAfterMinutes,
        });
        setError(null);
      } else {
        setError(getErrorMessage(err));
        setRateLimitError(null);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleDevicePress = (device: Device) => {
    router.push(`/devices/${device.name.sanitized}`);
  };

  // Swipe gesture handler for tab navigation
  const swipeGesture = Gesture.Pan()
    .activeOffsetX([-10, 10])
    .failOffsetY([-5, 5])
    .onEnd((event) => {
      const swipeThreshold = 50;
      if (event.translationX > swipeThreshold) {
        // Swipe right - go to last tab (Profile) for circular navigation
        router.push("/(tabs)/profile");
      } else if (event.translationX < -swipeThreshold) {
        // Swipe left - go to next tab (Search)
        router.push("/(tabs)/search");
      }
    });

  if (loading) {
    return (
      <Center flex={1} bg={colors.background}>
        <Spinner size={8} color={colors.primary} />
        <Text color={colors.textSecondary} mt={4}>
          Loading...
        </Text>
      </Center>
    );
  }

  if (rateLimitError) {
    return (
      <RateLimitError
        retryAfterMinutes={rateLimitError.retryAfterMinutes}
        onRetry={loadInitialData}
      />
    );
  }

  if (error) {
    return (
      <Center flex={1} bg={colors.background}>
        <Text color={colors.error}>{error}</Text>
      </Center>
    );
  }

  const renderDeviceSection = (
    title: string,
    icon: string,
    devices: Device[],
    seeMoreText: string,
    onSeeMorePress: () => void,
  ) => {
    if (devices.length === 0) return null;

    return (
      <Box mb={6} px={4}>
        <HStack alignItems="center" space={2} mb={3}>
          <Feather name={icon as any} size={20} color={colors.primary} />
          <Text fontSize="lg" fontWeight="bold" color={colors.textPrimary}>
            {title}
          </Text>
        </HStack>
        <View style={styles.gridContainer}>
          {devices.map((device, index) => {
            const isLeftColumn = index % 2 === 0;
            return (
              <View
                key={device.id}
                style={[
                  styles.cardWrapper,
                  {
                    width: safeCardWidth,
                    marginRight: isLeftColumn ? cardGap : 0,
                    marginBottom: cardGap,
                  },
                ]}
              >
                <Box flex={1} height={250}>
                  <DeviceCard
                    device={device}
                    onPress={() => handleDevicePress(device)}
                  />
                </Box>
              </View>
            );
          })}
        </View>
        {/* See More Button */}
        <Pressable onPress={onSeeMorePress}>
          <Box
            bg={colors.backgroundCard}
            borderRadius="md"
            borderWidth={1}
            borderColor={colors.border}
            py={3}
            px={4}
            mt={3}
          >
            <HStack alignItems="center" justifyContent="center" space={2}>
              <Text
                fontSize="sm"
                color={colors.textPrimary}
                fontWeight="medium"
              >
                {seeMoreText}
              </Text>
              <Feather name="arrow-right" size={16} color={colors.primary} />
            </HStack>
          </Box>
        </Pressable>
      </Box>
    );
  };

  return (
    <GestureDetector gesture={swipeGesture}>
      <Box flex={1} bg={colors.background}>
        <ScrollView>
          <VStack space={4} pt={Math.max(insets.top, 16)}>
            {/* Logo Section */}
            <Box mb={1} px={4}>
              <HStack space={2} alignItems="center" justifyContent="center">
                <Image
                  source={require("../../assets/logos/retro-ranker/rr-logo.png")}
                  alt="Retro Ranker Logo"
                  width={16}
                  height={16}
                  resizeMode="contain"
                />
                <Text
                  fontSize="md"
                  fontWeight="bold"
                  color={colors.primary}
                >
                  Retro Ranker
                </Text>
              </HStack>
            </Box>

            {/* New Arrivals Section */}
            {renderDeviceSection(
              "New Arrivals",
              "zap",
              newArrivals,
              "More New Arrivals",
              () =>
                router.push({
                  pathname: "/(tabs)/search",
                  params: { sortBy: "new-arrivals" },
                }),
            )}

            {/* Bang for Your Buck Section */}
            {renderDeviceSection(
              "Bang for Your Buck",
              "dollar-sign",
              bangForYourBuck,
              "More Bang for Your Buck",
              () =>
                router.push({
                  pathname: "/(tabs)/search",
                  params: { sortBy: "highly-ranked", category: "mid" },
                }),
            )}

            {/* Personal Picks Section */}
            {renderDeviceSection(
              "Personal Picks",
              "star",
              personalPicks,
              "More Personal Picks",
              () => {
                if (personalPickTagId) {
                  router.push({
                    pathname: "/(tabs)/search",
                    params: { tagId: personalPickTagId },
                  });
                } else {
                  router.push("/(tabs)/search");
                }
              },
            )}

            {/* Bottom spacing */}
            <Box h={20} />
          </VStack>
        </ScrollView>
      </Box>
    </GestureDetector>
  );
}

const styles = StyleSheet.create({
  gridContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    width: "100%",
  },
  cardWrapper: {
    height: 280,
  },
});
