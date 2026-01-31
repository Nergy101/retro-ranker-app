import {
  Box,
  Center,
  ScrollView,
  Spinner,
  Text,
  VStack,
} from "native-base";
import React, { useEffect, useState } from "react";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { DevicesPerBrandPerYearChart } from "../../components/charts/DevicesPerBrandPerYearChart";
import { DevicesPerReleaseYearChart } from "../../components/charts/DevicesPerReleaseYearChart";
import { OSDistributionChart } from "../../components/charts/OSDistributionChart";
import { useNetwork } from "../../contexts/NetworkContext";
import { DeviceService } from "../../services/devices/device.service";
import { colors } from "../../theme/colors";
import { Device } from "../../types/device.model";
import { getErrorMessage } from "../../utils/error-utils";

export default function ChartsPage() {
  const insets = useSafeAreaInsets();
  const deviceService = DeviceService.getInstance();
  const { isConnected } = useNetwork();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [devices, setDevices] = useState<Device[]>([]);
  const [isCached, setIsCached] = useState(false);

  useEffect(() => {
    loadDevices();
  }, [isConnected]);

  const loadDevices = async () => {
    try {
      setLoading(true);
      setIsCached(false);

      if (!isConnected) {
        const cached = await deviceService.getCachedAllDevicesAsync();
        setDevices(cached ?? []);
        setIsCached((cached?.length ?? 0) > 0);
        setError(null);
        setLoading(false);
        return;
      }

      const all = await deviceService.getAllDevices();
      setDevices(all);
      setError(null);
    } catch (err) {
      setError(getErrorMessage(err));
      const cached = await deviceService.getCachedAllDevicesAsync();
      setDevices(cached ?? []);
      setIsCached((cached?.length ?? 0) > 0);
    } finally {
      setLoading(false);
    }
  };

  if (loading && devices.length === 0) {
    return (
      <Box flex={1} bg={colors.background} pt={insets.top} pb={insets.bottom}>
        <Center flex={1}>
          <Spinner size="lg" color={colors.primary} />
          <Text color={colors.textSecondary} mt={4}>
            Loading charts…
          </Text>
        </Center>
      </Box>
    );
  }

  return (
    <Box flex={1} bg={colors.background} pt={insets.top} pb={insets.bottom}>
      <ScrollView
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 32 }}
        showsVerticalScrollIndicator={false}
      >
        <VStack space={10} pt={6}>
          <VStack alignItems="center" space={1} pb={2}>
            <Text
              fontSize="xl"
              fontWeight="bold"
              color={colors.textPrimary}
              textAlign="center"
            >
              Charts & Analytics
            </Text>
            <Text color={colors.textSecondary} textAlign="center">
              Explore data for{" "}
              <Text color={colors.primary} fontWeight="semibold">
                {devices.length}
              </Text>{" "}
              devices
              {isCached ? " (cached)" : ""}
            </Text>
            {error && (
              <Text color={colors.error} fontSize="sm" textAlign="center">
                {error}
              </Text>
            )}
          </VStack>

          {devices.length > 0 && (
            <>
              <Box
                bg={colors.backgroundCard}
                borderRadius="lg"
                p={4}
                pt={5}
                pb={5}
              >
                <Text
                  fontSize="lg"
                  fontWeight="600"
                  color={colors.textPrimary}
                  mb={3}
                >
                  Devices per release year
                </Text>
                <Box mt={2}>
                  <DevicesPerReleaseYearChart devices={devices} />
                </Box>
              </Box>

              <Box
                bg={colors.backgroundCard}
                borderRadius="lg"
                p={4}
                pt={5}
                pb={5}
              >
                <Text
                  fontSize="lg"
                  fontWeight="600"
                  color={colors.textPrimary}
                  mb={3}
                >
                  Devices per brand per year
                </Text>
                <Text fontSize="sm" color={colors.textSecondary} mb={2}>
                  Brands with ≥10 devices total. From 2020.
                </Text>
                <Box mt={2}>
                  <DevicesPerBrandPerYearChart devices={devices} />
                </Box>
              </Box>

              <Box
                bg={colors.backgroundCard}
                borderRadius="lg"
                p={4}
                pt={5}
                pb={5}
              >
                <Text
                  fontSize="lg"
                  fontWeight="600"
                  color={colors.textPrimary}
                  mb={3}
                >
                  OS distribution
                </Text>
                <Box mt={2}>
                  <OSDistributionChart devices={devices} />
                </Box>
              </Box>
            </>
          )}

          {!loading && devices.length === 0 && !error && (
            <Text color={colors.textSecondary} textAlign="center">
              No device data available. Connect to load charts.
            </Text>
          )}
        </VStack>
      </ScrollView>
    </Box>
  );
}
