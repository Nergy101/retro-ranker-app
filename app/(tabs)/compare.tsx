import React, { useEffect, useState } from "react";
import {
  Box,
  Button,
  Center,
  HStack,
  Image,
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
import {
  Ranking,
  RankingService,
} from "../../services/devices/ranking.service";
import {
  DeviceService,
  getDeviceImageUrl,
} from "../../services/devices/device.service";
import { ComparisonForm } from "../../components/comparisons/ComparisonForm";
import { DeviceComparisonResult } from "../../components/comparisons/DeviceComparisonResult";
import { DeviceCard } from "../../components/cards/DeviceCard";

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
  const [devices, setDevices] = useState<Device[]>([]);
  const [ranking, setRanking] = useState<Ranking | null>(null);
  const [exampleDevices, setExampleDevices] = useState<
    { [key: string]: Device }
  >({});
  const [loadingExamples, setLoadingExamples] = useState(true);
  const [isColorExplanationExpanded, setIsColorExplanationExpanded] = useState(
    false,
  );

  const deviceService = DeviceService.getInstance();

  // Swipe gesture handler - go back to main compare page
  const swipeGesture = Gesture.Pan()
    .activeOffsetX([-10, 10])
    .failOffsetY([-5, 5])
    .onEnd((event) => {
      const swipeThreshold = 50;
      // If devices are selected, swipe in any direction clears and goes back to main compare page
      if (devices.length > 0) {
        if (Math.abs(event.translationX) > swipeThreshold) {
          handleClearComparison();
        }
      } else {
        // If on main compare page, allow tab navigation
        if (event.translationX > swipeThreshold) {
          // Swipe right - go to previous tab (Search)
          router.push("/(tabs)/search");
        } else if (event.translationX < -swipeThreshold) {
          // Swipe left - go to next tab (Profile)
          router.push("/(tabs)/profile");
        }
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
    const devicesToCompare = [deviceA, deviceB];

    // Create ranking
    const rankingService = RankingService.getInstance();
    const newRanking = rankingService.createRanking(devicesToCompare);
    setRanking(newRanking);

    // Sort devices so the overall better one appears first
    const sortedDevices = [...devicesToCompare].sort((a, b) => {
      const overallRanking = newRanking.all;
      if (!overallRanking || overallRanking.length === 0) return 0;

      if (overallRanking[0] === "equal") return 0;

      // If device A is the winner, it should come first (return -1)
      if (overallRanking[0] === a.name.sanitized) return -1;
      // If device B is the winner, it should come first (return -1)
      if (overallRanking[0] === b.name.sanitized) return 1;

      return 0;
    });

    setDevices(sortedDevices);
  };

  const handleExampleClick = async (example: ExampleComparison) => {
    const deviceA = exampleDevices[example.deviceA];
    const deviceB = exampleDevices[example.deviceB];

    if (deviceA && deviceB) {
      handleCompare(deviceA, deviceB);
      // Scroll to results
      setTimeout(() => {
        // Results will appear below
      }, 100);
    }
  };

  const handleClearComparison = () => {
    setDevices([]);
    setRanking(null);
  };

  return (
    <GestureDetector gesture={swipeGesture}>
      <Box flex={1} bg={colors.background}>
        <ScrollView>
          <VStack space={4} p={4} pt={Math.max(insets.top, 16)}>
            <HStack justifyContent="space-between" alignItems="center" mb={2}>
              <Text fontSize="2xl" fontWeight="bold" color={colors.textPrimary}>
                Device Comparison
              </Text>
              {devices.length > 0 && (
                <Button
                  onPress={handleClearComparison}
                  bg={colors.backgroundCard}
                  borderWidth={1}
                  borderColor={colors.border}
                  size="sm"
                  _pressed={{ bg: colors.backgroundElevated }}
                >
                  <Text color={colors.textPrimary} fontSize="xs">
                    Return
                  </Text>
                </Button>
              )}
            </HStack>

            {/* Example Comparisons */}
            {devices.length === 0 && (
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
            )}

            {devices.length === 0 && (
              <ComparisonForm onCompare={handleCompare} />
            )}

            {devices.length === 2 && ranking && (
              <>
                {/* Color Explanation */}
                <Box bg={colors.backgroundCard} p={4} borderRadius="md" mb={4}>
                  <Pressable
                    onPress={() =>
                      setIsColorExplanationExpanded(
                        !isColorExplanationExpanded,
                      )}
                  >
                    <HStack justifyContent="space-between" alignItems="center">
                      <Text
                        fontSize="md"
                        fontWeight="bold"
                        color={colors.textPrimary}
                      >
                        How Ranking Colors Work
                      </Text>
                      <Text fontSize="lg" color={colors.primary}>
                        {isColorExplanationExpanded ? "▲" : "▼"}
                      </Text>
                    </HStack>
                  </Pressable>
                  {isColorExplanationExpanded && (
                    <VStack space={2} mt={3}>
                      <HStack space={2} alignItems="center">
                        <Box
                          bg={colors.success}
                          borderRadius="full"
                          width={20}
                          height={20}
                        />
                        <Text fontSize="sm" color={colors.textPrimary}>
                          Green = Better in this category
                        </Text>
                      </HStack>
                      <HStack space={2} alignItems="center">
                        <Box
                          bg={colors.info}
                          borderRadius="full"
                          width={20}
                          height={20}
                        />
                        <Text fontSize="sm" color={colors.textPrimary}>
                          Blue = Equal in this category
                        </Text>
                      </HStack>
                      <HStack space={2} alignItems="center">
                        <Box
                          bg={colors.error}
                          borderRadius="full"
                          width={20}
                          height={20}
                        />
                        <Text fontSize="sm" color={colors.textPrimary}>
                          Red = Worse in this category
                        </Text>
                      </HStack>
                    </VStack>
                  )}
                </Box>

                <VStack space={4}>
                  {devices.map((device) => (
                    <DeviceComparisonResult
                      key={device.id}
                      device={device}
                      ranking={ranking}
                    />
                  ))}
                </VStack>
              </>
            )}

            {devices.length === 0 && (
              <Box bg={colors.backgroundCard} p={4} borderRadius="md">
                <Text color={colors.textSecondary} textAlign="center">
                  Select two devices above to compare their specifications
                  side-by-side.
                </Text>
              </Box>
            )}
          </VStack>
        </ScrollView>
      </Box>
    </GestureDetector>
  );
}
