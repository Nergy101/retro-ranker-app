import React from "react";
import { Box, HStack, Text, VStack } from "native-base";
import { Device } from "../../types/device.model";
import { colors } from "../../theme/colors";

interface SpecSummaryProps {
  device: Device;
}

export function SpecSummary({ device }: SpecSummaryProps) {
  const specs = [
    {
      label: "OS / CFW",
      value: device.os.list.join(", ") +
        (device.os.customFirmwares.length > 0
          ? ` (${device.os.customFirmwares.join(", ")})`
          : ""),
    },
    {
      label: "SOC",
      value: device.cpus?.[0]?.names.join(", ") || "Unknown",
    },
    {
      label: "CPU",
      value: device.cpus?.[0]
        ? `${device.cpus[0].cores || "Unknown"} cores @ ${
          device.cpus[0].clockSpeed?.max || "Unknown"
        } ${device.cpus[0].clockSpeed?.unit || ""}`
        : "Unknown",
    },
    {
      label: "GPU",
      value: device.gpus?.[0]?.name || "Unknown",
    },
    {
      label: "RAM",
      value: device.ram
        ? `${device.ram.sizes?.join(", ") || "Unknown"} ${
          device.ram.unit || ""
        }`
        : "Unknown",
    },
    {
      label: "Display",
      value: device.screen
        ? `${device.screen.size || "Unknown"}" ${
          device.screen.resolution && device.screen.resolution.length > 0
            ? device.screen.resolution.map((res) =>
              `${res.width}x${res.height}`
            ).join(", ")
            : "Unknown"
        } (${device.screen.type?.type || "Unknown"})`
        : "Unknown",
    },
    {
      label: "Battery",
      value: device.battery
        ? `${device.battery.capacity || "Unknown"} ${
          device.battery.unit || ""
        } (${device.battery.type || "Unknown"})`
        : "Unknown",
    },
    {
      label: "Dimensions",
      value: device.dimensions
        ? `${device.dimensions.length}x${device.dimensions.width}x${device.dimensions.height}`
        : "Unknown",
    },
  ].filter((spec) => spec.value !== "Unknown" && spec.value !== "");

  return (
    <Box bg={colors.backgroundCard} p={4} borderRadius="md">
      <Text fontSize="xl" fontWeight="bold" color={colors.textPrimary} mb={4}>
        Spec Summary
      </Text>
      <VStack space={2}>
        {specs.map((spec, index) => (
          <HStack
            key={index}
            justifyContent="space-between"
            alignItems="flex-start"
          >
            <Text
              color={colors.textSecondary}
              fontSize="sm"
              fontWeight="semibold"
              flex={1}
              mr={2}
            >
              {spec.label}:
            </Text>
            <Text
              color={colors.textPrimary}
              fontSize="sm"
              flex={2}
              textAlign="right"
            >
              {spec.value}
            </Text>
          </HStack>
        ))}
      </VStack>
    </Box>
  );
}
