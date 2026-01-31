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
import { useLocalSearchParams } from "expo-router";
import { Device } from "../types/device.model";
import { Ranking, RankingService } from "../services/devices/ranking.service";
import { DeviceService } from "../services/devices/device.service";
import { DeviceComparisonResult } from "../components/comparisons/DeviceComparisonResult";
import { colors } from "../theme/colors";

export default function CompareResultsPage() {
  const params = useLocalSearchParams<{ deviceA: string; deviceB: string }>();
  const deviceA = params.deviceA ?? "";
  const deviceB = params.deviceB ?? "";

  const [devices, setDevices] = useState<Device[]>([]);
  const [ranking, setRanking] = useState<Ranking | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isColorExplanationExpanded, setIsColorExplanationExpanded] = useState(
    false,
  );

  const deviceService = DeviceService.getInstance();

  const loadAndCompare = useCallback(async () => {
    if (!deviceA || !deviceB) {
      setError("Missing device parameters");
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const [loadedA, loadedB] = await Promise.all([
        deviceService.getDeviceByName(deviceA),
        deviceService.getDeviceByName(deviceB),
      ]);
      if (!loadedA || !loadedB) {
        setError("One or both devices could not be loaded");
        setLoading(false);
        return;
      }
      const devicesToCompare = [loadedA, loadedB];
      const rankingService = RankingService.getInstance();
      const newRanking = rankingService.createRanking(devicesToCompare);
      const sortedDevices = [...devicesToCompare].sort((a, b) => {
        const overallRanking = newRanking.all;
        if (!overallRanking || overallRanking.length === 0) return 0;
        if (overallRanking[0] === "equal") return 0;
        if (overallRanking[0] === a.name.sanitized) return -1;
        if (overallRanking[0] === b.name.sanitized) return 1;
        return 0;
      });
      setRanking(newRanking);
      setDevices(sortedDevices);
    } catch (err) {
      console.error("Failed to load comparison:", err);
      setError("Failed to load comparison");
    } finally {
      setLoading(false);
    }
  }, [deviceA, deviceB]);

  useEffect(() => {
    loadAndCompare();
  }, [loadAndCompare]);

  if (loading) {
    return (
      <Box flex={1} bg={colors.background} justifyContent="center" p={4}>
        <Center>
          <Spinner size="lg" color={colors.primary} />
          <Text color={colors.textSecondary} mt={4}>
            Loading comparison...
          </Text>
        </Center>
      </Box>
    );
  }

  if (error || !ranking || devices.length !== 2) {
    return (
      <Box flex={1} bg={colors.background} justifyContent="center" p={4}>
        <Center>
          <Text color={colors.error} textAlign="center">
            {error ?? "Could not load comparison"}
          </Text>
        </Center>
      </Box>
    );
  }

  return (
    <Box flex={1} bg={colors.background}>
      <ScrollView>
        <VStack space={4} p={4}>
          {/* Color Explanation */}
          <Box bg={colors.backgroundCard} p={4} borderRadius="md" mb={4}>
            <Pressable
              onPress={() =>
                setIsColorExplanationExpanded(!isColorExplanationExpanded)}
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
        </VStack>
      </ScrollView>
    </Box>
  );
}
