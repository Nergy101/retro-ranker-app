import React, { useCallback, useEffect, useState } from "react";
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
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import { useRouter } from "expo-router";
import { colors } from "../../theme/colors";
import { Device } from "../../types/device.model";
import { DeviceService } from "../../services/devices/device.service";
import { DeviceCollectionService } from "../../services/devices/device-collection.service";
import { ComparisonForm } from "../../components/comparisons/ComparisonForm";
import { DeviceCard } from "../../components/cards/DeviceCard";
import { useFavoritedDeviceIds } from "../../hooks/useFavoritedDeviceIds";
import { useAuth } from "../../contexts/AuthContext";

interface ExampleComparison {
  deviceA: string; // sanitized name
  deviceB: string; // sanitized name
  label: string;
}

const exampleComparisons: ExampleComparison[] = [
  {
    deviceA: "steam-deck-oled",
    deviceB: "switch-2",
    label: "Steam Deck OLED vs Switch 2",
  },
  { deviceA: "rg-477m", deviceB: "rg-476h", label: "RG 477M vs RG 476H" },
  {
    deviceA: "retroid-pocket-flip-2",
    deviceB: "thor",
    label: "Retroid Pocket Flip 2 vs Thor",
  },
];

export default function ComparePage() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { user, authenticated } = useAuth();
  const { favoritedDeviceIds, refetch } = useFavoritedDeviceIds();
  const [exampleDevices, setExampleDevices] = useState<
    { [key: string]: Device }
  >({});
  const [loadingExamples, setLoadingExamples] = useState(true);

  const deviceCollectionService = DeviceCollectionService.getInstance();
  const deviceService = DeviceService.getInstance();

  // Swipe gesture for tab navigation
  const swipeGesture = Gesture.Pan()
    .activeOffsetX([-10, 10])
    .failOffsetY([-5, 5])
    .onEnd((event) => {
      const swipeThreshold = 50;
      if (event.translationX > swipeThreshold) {
        router.push("/(tabs)/search");
      } else if (event.translationX < -swipeThreshold) {
        router.push("/(tabs)/profile");
      }
    });

  useEffect(() => {
    loadExampleDevices();
  }, []);

  const loadExampleDevices = async () => {
    try {
      const allDeviceNames = [
        ...exampleComparisons.map((ex) => ex.deviceA),
        ...exampleComparisons.map((ex) => ex.deviceB),
      ];
      const uniqueNames = Array.from(new Set(allDeviceNames));

      const devicePromises = uniqueNames.map((name) =>
        deviceService.getDeviceByName(name).catch(() => null)
      );
      const loadedDevices = await Promise.all(devicePromises);

      const deviceMap: { [key: string]: Device } = {};
      uniqueNames.forEach((name, index) => {
        if (loadedDevices[index]) {
          deviceMap[name] = loadedDevices[index]!;
        }
      });

      setExampleDevices(deviceMap);
    } catch (err) {
      console.error("Failed to load example devices:", err);
    } finally {
      setLoadingExamples(false);
    }
  };

  const handleCompare = (deviceA: Device, deviceB: Device) => {
    router.push({
      pathname: "/compare-results",
      params: {
        deviceA: deviceA.name.sanitized,
        deviceB: deviceB.name.sanitized,
      },
    });
  };

  const handleExampleClick = (example: ExampleComparison) => {
    const deviceA = exampleDevices[example.deviceA];
    const deviceB = exampleDevices[example.deviceB];

    if (deviceA && deviceB) {
      handleCompare(deviceA, deviceB);
    }
  };

  const handleToggleFavorite = useCallback(
    async (device: Device) => {
      if (!user?.id) return;
      const isFavorited = favoritedDeviceIds.has(device.id);
      try {
        if (isFavorited) {
          await deviceCollectionService.removeFavorite(user.id, device.id);
        } else {
          await deviceCollectionService.addFavorite(user.id, device.id);
        }
        await refetch();
      } catch (err) {
        console.error("Error toggling favorite:", err);
      }
    },
    [user?.id, favoritedDeviceIds, refetch],
  );

  return (
    <GestureDetector gesture={swipeGesture}>
      <Box flex={1} bg={colors.background}>
        <ScrollView>
          <VStack space={4} p={4} pt={Math.max(insets.top, 16)}>
            <Text
              fontSize="2xl"
              fontWeight="bold"
              color={colors.textPrimary}
              mb={2}
            >
              Device Comparison
            </Text>

            {/* Example Comparisons */}
            <Box mb={4}>
              {loadingExamples
                ? (
                  <Center py={8}>
                    <Spinner size="lg" color={colors.primary} />
                    <Text color={colors.textSecondary} mt={4}>
                      Loading devices...
                    </Text>
                  </Center>
                )
                : (
                  <>
                    <Text
                      fontSize="md"
                      fontWeight="semibold"
                      color={colors.textSecondary}
                      mb={3}
                    >
                      Popular Comparisons
                    </Text>
                    <VStack space={3}>
                      {exampleComparisons.map((example, index) => {
                        const deviceA = exampleDevices[example.deviceA];
                        const deviceB = exampleDevices[example.deviceB];

                        if (!deviceA || !deviceB) return null;

                        return (
                          <Pressable
                            key={index}
                            onPress={() => handleExampleClick(example)}
                          >
                            {({ isPressed }) => (
                              <Box
                                opacity={isPressed ? 0.7 : 1}
                                mb={3}
                              >
                                <HStack
                                  space={3}
                                  alignItems="stretch"
                                  justifyContent="space-between"
                                >
                                  <Box flex={1} maxWidth="48%" height={250}>
                                    <DeviceCard
                                      device={deviceA}
                                      imageOnly={false}
                                      isFavorited={favoritedDeviceIds.has(
                                        deviceA.id,
                                      )}
                                      onToggleFavorite={authenticated
                                        ? () => handleToggleFavorite(deviceA)
                                        : undefined}
                                    />
                                  </Box>
                                  <Box
                                    width={10}
                                    alignItems="center"
                                    justifyContent="center"
                                    alignSelf="center"
                                  >
                                    <Text
                                      fontSize="lg"
                                      color={colors.primary}
                                      fontWeight="bold"
                                    >
                                      VS
                                    </Text>
                                  </Box>
                                  <Box flex={1} maxWidth="48%" height={250}>
                                    <DeviceCard
                                      device={deviceB}
                                      imageOnly={false}
                                      isFavorited={favoritedDeviceIds.has(
                                        deviceB.id,
                                      )}
                                      onToggleFavorite={authenticated
                                        ? () => handleToggleFavorite(deviceB)
                                        : undefined}
                                    />
                                  </Box>
                                </HStack>
                              </Box>
                            )}
                          </Pressable>
                        );
                      })}
                    </VStack>
                  </>
                )}
            </Box>

            <ComparisonForm onCompare={handleCompare} />

            <Box bg={colors.backgroundCard} p={4} borderRadius="md">
              <Text color={colors.textSecondary} textAlign="center">
                Select two devices above to compare their specifications
                side-by-side.
              </Text>
            </Box>
          </VStack>
        </ScrollView>
      </Box>
    </GestureDetector>
  );
}
