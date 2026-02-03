import React, { useEffect, useState } from "react";
import {
  Box,
  Center,
  HStack,
  Pressable,
  ScrollView,
  Spinner,
  Text,
  VStack,
} from "native-base";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { DeviceCollectionService } from "../../services/devices/device-collection.service";
import { DeviceCollection } from "../../types/device-collection";
import { DeviceCard } from "../../components/cards/DeviceCard";
import { colors } from "../../theme/colors";
import { SAFE_AREA_TOP_PADDING_MIN } from "../../utils/constants";
import { useAuth } from "../../contexts/AuthContext";
import { useFavoritedDeviceIds } from "../../hooks/useFavoritedDeviceIds";

export default function CollectionDetailPage() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { authenticated, user } = useAuth();
  const { favoritedDeviceIds } = useFavoritedDeviceIds();
  const [collection, setCollection] = useState<DeviceCollection | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const deviceCollectionService = DeviceCollectionService.getInstance();

  useEffect(() => {
    if (id) {
      loadCollection();
    }
  }, [id, authenticated, user?.id]);

  const loadCollection = async () => {
    try {
      setLoading(true);
      setError(null);

      // Get all collections and find the one with matching ID
      const collections = await deviceCollectionService
        .getUserDeviceCollections(
          authenticated && user?.id ? user.id : "",
        );

      const foundCollection = collections.find((c) => c.id === id);

      if (!foundCollection) {
        setError("Collection not found");
        return;
      }

      setCollection(foundCollection);
    } catch (err) {
      console.error("Error loading collection:", err);
      setError("Failed to load collection");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Box flex={1} bg={colors.background}>
        <Center flex={1}>
          <Spinner size="lg" color={colors.primary} />
          <Text color={colors.textSecondary} mt={4}>
            Loading collection...
          </Text>
        </Center>
      </Box>
    );
  }

  if (error || !collection) {
    return (
      <Box flex={1} bg={colors.background}>
        <Center flex={1} px={6}>
          <VStack space={4} alignItems="center">
            <Text color={colors.textPrimary} fontSize="xl" fontWeight="bold">
              {error || "Collection not found"}
            </Text>
            <Pressable
              onPress={() => router.back()}
              bg={colors.primary}
              _pressed={{ bg: colors.primaryHover }}
              px={6}
              py={3}
              borderRadius="md"
            >
              <Text color={colors.textPrimary} fontWeight="semibold">
                Go Back
              </Text>
            </Pressable>
          </VStack>
        </Center>
      </Box>
    );
  }

  return (
    <Box flex={1} bg={colors.background}>
      <ScrollView>
        <VStack
          space={4}
          p={6}
          style={{ paddingTop: Math.max(insets.top, SAFE_AREA_TOP_PADDING_MIN) }}
        >
          {/* Header */}
          <VStack space={2}>
            <VStack space={1}>
              <Text
                color={colors.textPrimary}
                fontSize="2xl"
                fontWeight="bold"
              >
                {collection.name}
              </Text>
              <Box
                bg={colors.primaryFocus}
                borderRadius="full"
                px={3}
                py={1}
                alignSelf="flex-start"
              >
                <Text fontSize="sm" color={colors.textSecondary}>
                  {collection.deviceCount}{" "}
                  {collection.deviceCount === 1 ? "device" : "devices"}
                </Text>
              </Box>
              {collection.description && (
                <Text color={colors.textSecondary} fontSize="md" mt={1}>
                  {collection.description}
                </Text>
              )}
            </VStack>
          </VStack>

          {/* Devices Grid */}
          {collection.devices.length === 0
            ? (
              <Center py={8}>
                <Text color={colors.textSecondary} textAlign="center">
                  No devices in this collection
                </Text>
              </Center>
            )
            : (
              <VStack space={3}>
                {Array.from({
                  length: Math.ceil(collection.devices.length / 2),
                }).map((_, rowIndex) => (
                  <HStack
                    key={rowIndex}
                    space={3}
                    width="100%"
                    alignItems="stretch"
                  >
                    {collection.devices
                      .slice(rowIndex * 2, rowIndex * 2 + 2)
                      .map((device) => (
                        <Box key={device.id} flex={1} height={250}>
                          <DeviceCard
                            device={device}
                            onPress={() =>
                              router.push(`/devices/${device.name.sanitized}`)}
                            isFavorited={favoritedDeviceIds.has(device.id)}
                          />
                        </Box>
                      ))}
                    {/* Fill empty slot if odd number of items */}
                    {collection.devices.slice(rowIndex * 2, rowIndex * 2 + 2)
                          .length === 1 && <Box flex={1} />}
                  </HStack>
                ))}
              </VStack>
            )}
        </VStack>
      </ScrollView>
    </Box>
  );
}
