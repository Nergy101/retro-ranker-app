import React, { useEffect, useState } from "react";
import {
  Box,
  Button,
  Center,
  HStack,
  Image,
  ScrollView,
  Spinner,
  Text,
  VStack,
} from "native-base";
import { Feather } from "@expo/vector-icons";
import { useLocalSearchParams, useNavigation, useRouter } from "expo-router";
import { Dimensions, StyleSheet, View } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  DeviceService,
  getDeviceImageUrl,
} from "../../services/devices/device.service";
import { Device } from "../../types/device.model";
import { DeviceCard } from "../../components/cards/DeviceCard";
import { TagComponent } from "../../components/shared/TagComponent";
import { EmulationCapabilities } from "../../components/devices/EmulationCapabilities";
import { SpecSummary } from "../../components/specifications/SpecSummary";
import { FullSpecs } from "../../components/specifications/FullSpecs";
import { RateLimitError } from "../../components/errors/RateLimitError";
import { colors } from "../../theme/colors";
import { getRateLimitInfo, getErrorMessage } from "../../utils/error-utils";

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

export default function DeviceDetailPage() {
  const { name } = useLocalSearchParams<{ name: string }>();
  const router = useRouter();
  const navigation = useNavigation();
  const screenWidth = Dimensions.get("window").width;
  const [device, setDevice] = useState<Device | null>(null);
  const [similarDevices, setSimilarDevices] = useState<Device[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [rateLimitError, setRateLimitError] = useState<{
    retryAfterMinutes: number;
  } | null>(null);

  const deviceService = DeviceService.getInstance();

  // Update navigation title when device is loaded
  useEffect(() => {
    if (device) {
      navigation.setOptions({
        title: `${device.brand.raw} ${device.name.raw}`,
      });
    }
  }, [device, navigation]);

  // Calculate card width for 2-column grid with gaps (same as home page)
  const cardGap = 12;
  const horizontalPadding = 16;
  const availableWidth = screenWidth - (horizontalPadding * 2);
  const cardWidth = Math.floor((availableWidth - cardGap) / 2);

  useEffect(() => {
    if (name) {
      loadDevice();
    }
  }, [name]);

  const loadDevice = async () => {
    try {
      setLoading(true);
      const [deviceData, similar] = await Promise.all([
        deviceService.getDeviceByName(name!),
        deviceService.getSimilarDevices(name!, 4),
      ]);

      if (!deviceData) {
        setError("Device not found");
        return;
      }

      setDevice(deviceData);
      setSimilarDevices(similar);
      // Clear any previous errors on successful load
      setRateLimitError(null);
      setError(null);
    } catch (err) {
      const rateLimitInfo = getRateLimitInfo(err);
      if (rateLimitInfo) {
        setRateLimitError({ retryAfterMinutes: rateLimitInfo.retryAfterMinutes });
        setError(null);
      } else {
        setError(getErrorMessage(err));
        setRateLimitError(null);
      }
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Center flex={1} bg={colors.background}>
        <Spinner size={8} color={colors.primary} />
        <Text color={colors.textSecondary} mt={4}>Loading device...</Text>
      </Center>
    );
  }

  if (rateLimitError) {
    return (
      <RateLimitError
        retryAfterMinutes={rateLimitError.retryAfterMinutes}
        onRetry={loadDevice}
      />
    );
  }

  if (error || !device) {
    return (
      <Center flex={1} bg={colors.background}>
        <Text color={colors.error}>{error || "Device not found"}</Text>
        <Button
          mt={4}
          onPress={() => router.back()}
          bg={colors.primary}
          size="md"
        >
          Go Back
        </Button>
      </Center>
    );
  }

  const imageUrl = getDeviceImageUrl(device);

  return (
    <Box flex={1} bg={colors.background}>
      <ScrollView>
        <VStack space={4} p={4}>
          {/* Device Image */}
          <Box>
            <Image
              source={{ uri: imageUrl }}
              alt={device.name.raw}
              width="full"
              height={300}
              resizeMode="contain"
              bg={colors.backgroundElevated}
              borderRadius="md"
              p={4}
            />
          </Box>

          {/* Device Name and Brand */}
          <VStack space={2}>
            <Text fontSize="3xl" fontWeight="bold" color={colors.textPrimary}>
              {device.brand.raw} {device.name.raw}
            </Text>
            {device.pricing.average && (
              <HStack alignItems="center" space={1}>
                <Feather name="dollar-sign" size={18} color={colors.primary} />
                <Text
                  fontSize="lg"
                  color={colors.primary}
                  fontWeight="semibold"
                >
                  {device.pricing.average}
                </Text>
              </HStack>
            )}
          </VStack>

          {/* Tags */}
          {device.tags && device.tags.length > 0 && (
            <Box>
              <HStack space={1.5} flexWrap="wrap">
                {device.tags.map((tag) => (
                  <TagComponent
                    key={tag.id || tag.slug}
                    tag={tag}
                    size="xs"
                    onPress={async () => {
                      // Store tagId in AsyncStorage for the search page to read
                      // Use id if available, otherwise use slug
                      const tagIdentifier = tag.id || tag.slug;
                      if (tagIdentifier) {
                        try {
                          await AsyncStorage.setItem(
                            "selectedTagId",
                            tagIdentifier,
                          );
                          // Navigate to search tab with tagId param
                          router.push({
                            pathname: "/(tabs)/search",
                            params: { tagId: tagIdentifier },
                          });
                        } catch (error) {
                          console.error("Error storing tagId:", error);
                        }
                      }
                    }}
                  />
                ))}
              </HStack>
            </Box>
          )}

          {/* Emulation Capabilities */}
          <EmulationCapabilities device={device} />

          {/* Spec Summary */}
          <SpecSummary device={device} />

          {/* Full Specifications */}
          <FullSpecs device={device} />

          {/* Cons */}
          {device.cons.length > 0 && (
            <Box bg={colors.backgroundCard} p={4} borderRadius="md">
              <Text fontSize="lg" fontWeight="bold" color={colors.error} mb={2}>
                Cons
              </Text>
              <VStack space={1}>
                {device.cons.map((con, idx) => (
                  <Text key={idx} color={colors.textPrimary} fontSize="sm">
                    • {con}
                  </Text>
                ))}
              </VStack>
            </Box>
          )}

          {/* Similar Devices */}
          {similarDevices.length > 0 && (
            <Box>
              <Text
                fontSize="xl"
                fontWeight="bold"
                color={colors.textPrimary}
                mb={4}
              >
                Similar Devices
              </Text>
              <View style={styles.gridContainer}>
                {similarDevices.map((similarDevice, index) => {
                  const isLeftColumn = index % 2 === 0;
                  return (
                    <View
                      key={similarDevice.id}
                      style={[
                        styles.cardWrapper,
                        {
                          width: cardWidth,
                          marginRight: isLeftColumn ? cardGap : 0,
                          marginBottom: cardGap,
                        },
                      ]}
                    >
                      <DeviceCard
                        device={similarDevice}
                        onPress={() =>
                          router.push(
                            `/devices/${similarDevice.name.sanitized}`,
                          )}
                      />
                    </View>
                  );
                })}
              </View>
            </Box>
          )}
        </VStack>
      </ScrollView>
    </Box>
  );
}
