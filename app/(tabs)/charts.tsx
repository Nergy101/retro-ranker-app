import {
  Box,
  Center,
  HStack,
  ScrollView,
  Slider,
  Spinner,
  Text,
  VStack,
} from "native-base";
import React, { useEffect, useMemo, useState } from "react";
import { TextInput } from "react-native";
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
  const [fromYear, setFromYear] = useState(2017);
  const [toYear, setToYear] = useState(new Date().getFullYear());
  const [minDevicesPerBrand, setMinDevicesPerBrand] = useState(12);
  const [minDevicesInput, setMinDevicesInput] = useState("12");

  // Debounce chart filter so it doesn't flicker on every keystroke
  useEffect(() => {
    const n = parseInt(minDevicesInput, 10);
    if (Number.isNaN(n) || n < 1) return;
    const t = setTimeout(() => setMinDevicesPerBrand(n), 400);
    return () => clearTimeout(t);
  }, [minDevicesInput]);

  const yearBounds = useMemo(() => {
    let min = 2010;
    let max = new Date().getFullYear();
    for (const d of devices) {
      const date = d.released?.mentionedDate;
      if (date) {
        const year = new Date(date).getFullYear();
        if (!Number.isNaN(year)) {
          min = Math.min(min, year);
          max = Math.max(max, year);
        }
      }
    }
    return { min, max };
  }, [devices]);

  const chartFromYear = Math.max(yearBounds.min, Math.min(fromYear, toYear));
  const chartToYear = Math.min(yearBounds.max, Math.max(fromYear, toYear));

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
      <Box flex={1} bg={colors.background} pt={8}>
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
    <Box flex={1} bg={colors.background} pt={8}>
      <ScrollView
        contentContainerStyle={{
          paddingHorizontal: 16,
          paddingBottom: 32 + insets.bottom,
        }}
        style={{ flex: 1 }}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <VStack space={10}>
          <Box
            bg={colors.backgroundCard}
            borderRadius="lg"
            p={4}
            pt={5}
            pb={5}
          >
            <VStack alignItems="center" space={2}>
              <Text
                fontSize="xl"
                fontWeight="bold"
                color={colors.textPrimary}
                textAlign="center"
              >
                By year, brand & OS
              </Text>
              <Text
                fontSize="sm"
                color={colors.textSecondary}
                textAlign="center"
                lineHeight={20}
              >
                See how devices in the database break down by release year, by brand over time, and by operating system. Use these charts to spot trends and compare the catalog at a glance.
              </Text>
              <Text color={colors.textTertiary} fontSize="xs" textAlign="center">
                Data for{" "}
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
          </Box>

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
                  fontSize="md"
                  fontWeight="600"
                  color={colors.textPrimary}
                  mb={3}
                >
                  Year range (for both charts below)
                </Text>
                <VStack space={3}>
                  <Text fontSize="sm" color={colors.textSecondary}>
                    From year: {fromYear}
                  </Text>
                  <Slider
                    minValue={yearBounds.min}
                    maxValue={yearBounds.max}
                    value={fromYear}
                    onChange={(v) => {
                      setFromYear(Math.round(v));
                      setToYear((prev) => Math.max(Math.round(v), prev));
                    }}
                    step={1}
                  >
                    <Slider.Track>
                      <Slider.FilledTrack bg={colors.primary} />
                    </Slider.Track>
                    <Slider.Thumb bg={colors.primary} />
                  </Slider>
                  <Text fontSize="sm" color={colors.textSecondary}>
                    To year: {toYear}
                  </Text>
                  <Slider
                    minValue={fromYear}
                    maxValue={yearBounds.max}
                    value={toYear}
                    onChange={(v) => {
                      setToYear(Math.round(v));
                      setFromYear((prev) => Math.min(Math.round(v), prev));
                    }}
                    step={1}
                  >
                    <Slider.Track>
                      <Slider.FilledTrack bg={colors.primary} />
                    </Slider.Track>
                    <Slider.Thumb bg={colors.primary} />
                  </Slider>
                </VStack>
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
                  Devices per release year
                </Text>
                <Box mt={2}>
                  <DevicesPerReleaseYearChart
                    devices={devices}
                    fromYear={chartFromYear}
                    toYear={chartToYear}
                  />
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
                <HStack alignItems="center" space={2} flexWrap="wrap" mb={3}>
                  <Text fontSize="sm" color={colors.textSecondary}>
                    Only show brands that made more than
                  </Text>
                  <TextInput
                    value={minDevicesInput}
                    onChangeText={setMinDevicesInput}
                    keyboardType="number-pad"
                    style={{
                      width: 64,
                      paddingHorizontal: 8,
                      paddingVertical: 6,
                      fontSize: 14,
                      backgroundColor: colors.background,
                      borderWidth: 1,
                      borderColor: colors.border,
                      borderRadius: 4,
                      color: colors.textPrimary,
                    }}
                    placeholderTextColor={colors.textTertiary}
                  />
                  <Text fontSize="sm" color={colors.textSecondary}>
                    devices
                  </Text>
                </HStack>
                <Box mt={2}>
                  <DevicesPerBrandPerYearChart
                    devices={devices}
                    fromYear={chartFromYear}
                    toYear={chartToYear}
                    minDevicesPerBrand={Math.max(1, minDevicesPerBrand)}
                  />
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
