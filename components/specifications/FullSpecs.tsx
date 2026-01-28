import React, { useState } from "react";
import { Box, HStack, Pressable, Text, VStack } from "native-base";
import { Device } from "../../types/device.model";
import { colors } from "../../theme/colors";

interface FullSpecsProps {
  device: Device;
}

export function FullSpecs({ device }: FullSpecsProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const renderSpecRow = (label: string, value: string | null | undefined) => {
    if (!value) return null;
    return (
      <HStack
        justifyContent="space-between"
        py={1.5}
        borderBottomWidth={1}
        borderBottomColor={colors.border}
      >
        <Text color={colors.textSecondary} fontSize="sm" flex={1}>
          {label}
        </Text>
        <Text
          color={colors.textPrimary}
          fontSize="sm"
          flex={2}
          textAlign="right"
        >
          {value}
        </Text>
      </HStack>
    );
  };

  return (
    <Box bg={colors.backgroundCard} p={4} borderRadius="md">
      <Pressable onPress={() => setIsExpanded(!isExpanded)}>
        <HStack
          justifyContent="space-between"
          alignItems="center"
          mb={isExpanded ? 4 : 0}
        >
          <Text fontSize="xl" fontWeight="bold" color={colors.textPrimary}>
            Full Specifications
          </Text>
          <Text fontSize="lg" color={colors.primary}>
            {isExpanded ? "▲" : "▼"}
          </Text>
        </HStack>
      </Pressable>
      {isExpanded && (
        <VStack space={4}>
          {/* System */}
          <Box>
            <Text fontSize="md" fontWeight="bold" color={colors.primary} mb={2}>
              System
            </Text>
            <VStack>
              {renderSpecRow("OS", device.os.list.join(", "))}
              {device.os.customFirmwares.length > 0 &&
                renderSpecRow(
                  "Custom Firmware",
                  device.os.customFirmwares.join(", "),
                )}
              {renderSpecRow("Architecture", device.architecture?.type)}
              {renderSpecRow("System on Chip", device.systemOnChip)}
              {renderSpecRow("Form Factor", device.formFactor)}
            </VStack>
          </Box>

          {/* Processor */}
          {(device.cpus || device.gpus) && (
            <Box>
              <Text
                fontSize="md"
                fontWeight="bold"
                color={colors.primary}
                mb={2}
              >
                Processor
              </Text>
              <VStack>
                {device.cpus?.map((cpu, idx) => (
                  <React.Fragment key={idx}>
                    {renderSpecRow("CPU", cpu.names.join(", "))}
                    {renderSpecRow("CPU Cores", cpu.cores?.toString())}
                    {cpu.clockSpeed && renderSpecRow(
                      "CPU Clock Speed",
                      `${
                        cpu.clockSpeed.min ? `${cpu.clockSpeed.min}-` : ""
                      }${cpu.clockSpeed.max} ${cpu.clockSpeed.unit}`,
                    )}
                    {renderSpecRow("CPU Threads", cpu.threads?.toString())}
                  </React.Fragment>
                ))}
                {device.gpus?.map((gpu, idx) => (
                  <React.Fragment key={idx}>
                    {renderSpecRow("GPU", gpu.name)}
                    {gpu.clockSpeed && renderSpecRow(
                      "GPU Clock Speed",
                      `${
                        gpu.clockSpeed.min ? `${gpu.clockSpeed.min}-` : ""
                      }${gpu.clockSpeed.max} ${gpu.clockSpeed.unit}`,
                    )}
                    {renderSpecRow("GPU Cores", gpu.cores?.toString())}
                  </React.Fragment>
                ))}
              </VStack>
            </Box>
          )}

          {/* Memory & Storage */}
          <Box>
            <Text fontSize="md" fontWeight="bold" color={colors.primary} mb={2}>
              Memory & Storage
            </Text>
            <VStack>
              {renderSpecRow(
                "RAM",
                device.ram
                  ? `${device.ram.sizes?.join(", ") || ""} ${
                    device.ram.unit || ""
                  } ${device.ram.type || ""}`.trim()
                  : null,
              )}
              {renderSpecRow("Storage", device.storage)}
            </VStack>
          </Box>

          {/* Display */}
          {device.screen && (
            <Box>
              <Text
                fontSize="md"
                fontWeight="bold"
                color={colors.primary}
                mb={2}
              >
                Display
              </Text>
              <VStack>
                {renderSpecRow(
                  "Screen Size",
                  device.screen.size ? `${device.screen.size}"` : null,
                )}
                {device.screen.resolution &&
                  device.screen.resolution.length > 0 &&
                  renderSpecRow(
                    "Resolution",
                    device.screen.resolution.map((r) =>
                      `${r.width}x${r.height}`
                    ).join(", "),
                  )}
                {renderSpecRow("Screen Type", device.screen.type?.type)}
                {renderSpecRow("Aspect Ratio", device.screen.aspectRatio)}
                {renderSpecRow("Refresh Rate", device.screen.refreshRate)}
                {device.screen.ppi &&
                  renderSpecRow("PPI", device.screen.ppi.join(", "))}
              </VStack>
            </Box>
          )}

          {/* Battery & Power */}
          {device.battery && (
            <Box>
              <Text
                fontSize="md"
                fontWeight="bold"
                color={colors.primary}
                mb={2}
              >
                Battery & Power
              </Text>
              <VStack>
                {renderSpecRow(
                  "Battery Capacity",
                  device.battery.capacity
                    ? `${device.battery.capacity} ${device.battery.unit || ""}`
                    : null,
                )}
                {renderSpecRow("Battery Type", device.battery.type)}
                {renderSpecRow(
                  "Removable",
                  device.battery.removable ? "Yes" : "No",
                )}
                {renderSpecRow("Charging", device.battery.charging)}
                {renderSpecRow("Charge Port", device.chargePort?.type)}
              </VStack>
            </Box>
          )}

          {/* Controls */}
          {device.controls && (
            <Box>
              <Text
                fontSize="md"
                fontWeight="bold"
                color={colors.primary}
                mb={2}
              >
                Controls
              </Text>
              <VStack>
                {renderSpecRow(
                  "D-Pad",
                  device.controls.dPad?.type || device.controls.dpad,
                )}
                {device.controls.analogs && renderSpecRow(
                  "Analog Sticks",
                  `${
                    device.controls.analogs.dual
                      ? "Dual"
                      : device.controls.analogs.single
                      ? "Single"
                      : "None"
                  }${
                    device.controls.analogs.isHallSensor ? " (Hall Sensor)" : ""
                  }`,
                )}
                {renderSpecRow(
                  "Face Buttons",
                  device.controls.faceButtons ||
                    device.controls.numberOfFaceButtons?.toString(),
                )}
                {device.controls.shoulderButtons && renderSpecRow(
                  "Shoulder Buttons",
                  Object.entries(device.controls.shoulderButtons)
                    .filter(([_, value]) => value === true)
                    .map(([key]) => key)
                    .join(", "),
                )}
                {renderSpecRow("Touchscreen", device.controls.touchscreen)}
              </VStack>
            </Box>
          )}

          {/* Connectivity */}
          {device.connectivity && (
            <Box>
              <Text
                fontSize="md"
                fontWeight="bold"
                color={colors.primary}
                mb={2}
              >
                Connectivity
              </Text>
              <VStack>
                {renderSpecRow(
                  "WiFi",
                  device.connectivity.hasWifi ? "Yes" : "No",
                )}
                {renderSpecRow(
                  "Bluetooth",
                  device.connectivity.hasBluetooth ? "Yes" : "No",
                )}
                {renderSpecRow(
                  "USB-C",
                  device.connectivity.hasUsbC ? "Yes" : "No",
                )}
                {renderSpecRow(
                  "USB",
                  device.connectivity.hasUsb ? "Yes" : "No",
                )}
                {renderSpecRow(
                  "NFC",
                  device.connectivity.hasNfc ? "Yes" : "No",
                )}
              </VStack>
            </Box>
          )}

          {/* Physical */}
          <Box>
            <Text fontSize="md" fontWeight="bold" color={colors.primary} mb={2}>
              Physical
            </Text>
            <VStack>
              {device.dimensions && renderSpecRow(
                "Dimensions",
                `${device.dimensions.length}x${device.dimensions.width}x${device.dimensions.height}`,
              )}
              {renderSpecRow(
                "Weight",
                device.weight ? `${device.weight}g` : null,
              )}
              {renderSpecRow("Shell Material", device.shellMaterial?.raw)}
              {device.colors.length > 0 &&
                renderSpecRow("Colors", device.colors.join(", "))}
            </VStack>
          </Box>
        </VStack>
      )}
    </Box>
  );
}
