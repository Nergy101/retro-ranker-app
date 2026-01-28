import React, { useState } from "react";
import { Box, HStack, Pressable, Text, VStack } from "native-base";
import { Device } from "../../types/device.model";
import { colors } from "../../theme/colors";

interface DeviceComparisonTextProps {
  devices: Device[];
}

export function DeviceComparisonText({ devices }: DeviceComparisonTextProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  if (devices.length !== 2) {
    return null;
  }

  const [device1, device2] = devices;

  // Get price difference
  const price1 = device1.pricing?.average || 0;
  const price2 = device2.pricing?.average || 0;
  const priceDiff = Math.abs(price1 - price2);
  const cheaperDevice = price1 < price2 ? device1 : device2;
  const expensiveDevice = price1 < price2 ? device2 : device1;

  // Get screen size difference
  const screen1 = device1.screen?.size || 0;
  const screen2 = device2.screen?.size || 0;
  const screenDiff = Math.abs(screen1 - screen2).toFixed(1);
  const biggerScreen = screen1 > screen2 ? device1 : device2;

  // Get battery difference
  const battery1 = device1.battery?.capacity || 0;
  const battery2 = device2.battery?.capacity || 0;
  const batteryDiff = Math.abs(battery1 - battery2);
  const betterBattery = battery1 > battery2 ? device1 : device2;

  // Get RAM difference
  const ram1 = device1.ram?.sizes?.[0] || 0;
  const ram2 = device2.ram?.sizes?.[0] || 0;
  const ramDiff = Math.abs(ram1 - ram2);
  const moreRam = ram1 > ram2 ? device1 : device2;

  // Format values safely
  const formatScreenSize = (size: number | null) => size ? `${size}"` : "N/A";
  const formatRam = (device: Device) =>
    device.ram?.sizes?.[0]
      ? `${device.ram.sizes[0]} ${device.ram.unit || "GB"}`
      : "N/A";
  const formatBattery = (device: Device) =>
    device.battery?.capacity
      ? `${device.battery.capacity}${device.battery.unit || "mAh"}`
      : "N/A";
  const formatOS = (device: Device) =>
    device.os?.list?.length ? device.os.list.join(", ") : "Unknown OS";
  const formatPrice = (device: Device) =>
    device.pricing?.average ? `$${device.pricing.average}` : "N/A";

  return (
    <Box bg={colors.backgroundCard} p={4} borderRadius="md" mb={4}>
      <Pressable onPress={() => setIsExpanded(!isExpanded)}>
        <HStack justifyContent="space-between" alignItems="center">
          <Text fontSize="lg" fontWeight="bold" color={colors.textPrimary}>
            Textual Comparison
          </Text>
          <Text fontSize="lg" color={colors.primary}>
            {isExpanded ? "▲" : "▼"}
          </Text>
        </HStack>
      </Pressable>

      {isExpanded && (
        <VStack space={3} mt={4}>
          <Text fontSize="sm" color={colors.textPrimary}>
            The{" "}
            <Text fontWeight="bold">
              {device1.brand.raw} {device1.name.raw}
            </Text>{" "}
            and{" "}
            <Text fontWeight="bold">
              {device2.brand.raw} {device2.name.raw}
            </Text>{" "}
            are both retro gaming handhelds with different specifications and
            performance characteristics. This comparison highlights the key
            differences to help you choose the right device for your gaming
            needs.
          </Text>

          <Box>
            <Text fontSize="md" fontWeight="bold" color={colors.primary} mb={2}>
              Price Comparison
            </Text>
            <Text fontSize="sm" color={colors.textPrimary}>
              The{" "}
              <Text fontWeight="bold">
                {cheaperDevice.brand.raw} {cheaperDevice.name.raw}
              </Text>{" "}
              is priced at{" "}
              <Text fontWeight="bold">{formatPrice(cheaperDevice)}</Text>, while
              the{" "}
              <Text fontWeight="bold">
                {expensiveDevice.brand.raw} {expensiveDevice.name.raw}
              </Text>{" "}
              costs{" "}
              <Text fontWeight="bold">{formatPrice(expensiveDevice)}</Text>.
              {priceDiff > 0 && (
                <>
                  The price difference is approximately{" "}
                  <Text fontWeight="bold">${priceDiff}</Text>.
                </>
              )}
            </Text>
          </Box>

          <Box>
            <Text fontSize="md" fontWeight="bold" color={colors.primary} mb={2}>
              Display Comparison
            </Text>
            <Text fontSize="sm" color={colors.textPrimary}>
              The{" "}
              <Text fontWeight="bold">
                {biggerScreen.brand.raw} {biggerScreen.name.raw}
              </Text>{" "}
              features a{" "}
              <Text fontWeight="bold">
                {formatScreenSize(biggerScreen.screen?.size || null)}
              </Text>{" "}
              screen,
              {screenDiff !== "0.0" && (
                <>
                  which is <Text fontWeight="bold">{screenDiff}"</Text>{" "}
                  larger than the other device.
                </>
              )}
            </Text>
          </Box>

          <Box>
            <Text fontSize="md" fontWeight="bold" color={colors.primary} mb={2}>
              Battery Life
            </Text>
            <Text fontSize="sm" color={colors.textPrimary}>
              The{" "}
              <Text fontWeight="bold">
                {betterBattery.brand.raw} {betterBattery.name.raw}
              </Text>{" "}
              has a{" "}
              <Text fontWeight="bold">{formatBattery(betterBattery)}</Text>{" "}
              battery,
              {batteryDiff > 0 && (
                <>
                  providing{" "}
                  <Text fontWeight="bold">
                    {batteryDiff}
                    {betterBattery.battery?.unit || "mAh"}
                  </Text>{" "}
                  more capacity.
                </>
              )}
            </Text>
          </Box>

          <Box>
            <Text fontSize="md" fontWeight="bold" color={colors.primary} mb={2}>
              Memory
            </Text>
            <Text fontSize="sm" color={colors.textPrimary}>
              The{" "}
              <Text fontWeight="bold">
                {moreRam.brand.raw} {moreRam.name.raw}
              </Text>{" "}
              comes with <Text fontWeight="bold">{formatRam(moreRam)}</Text>
              {" "}
              of RAM,
              {ramDiff > 0 && (
                <>
                  which is{" "}
                  <Text fontWeight="bold">
                    {ramDiff} {moreRam.ram?.unit || "GB"}
                  </Text>{" "}
                  more than the other device.
                </>
              )}
            </Text>
          </Box>

          <Box>
            <Text fontSize="md" fontWeight="bold" color={colors.primary} mb={2}>
              Operating System
            </Text>
            <Text fontSize="sm" color={colors.textPrimary}>
              The{" "}
              <Text fontWeight="bold">
                {device1.brand.raw} {device1.name.raw}
              </Text>{" "}
              runs <Text fontWeight="bold">{formatOS(device1)}</Text>, while the
              {" "}
              <Text fontWeight="bold">
                {device2.brand.raw} {device2.name.raw}
              </Text>{" "}
              uses <Text fontWeight="bold">{formatOS(device2)}</Text>.
            </Text>
          </Box>
        </VStack>
      )}
    </Box>
  );
}
