import React, { useMemo } from "react";
import { View } from "react-native";
import Svg, { Path } from "react-native-svg";
import { Box, HStack, Text, VStack } from "native-base";
import { Device } from "../../types/device.model";
import { colors } from "../../theme/colors";

interface OSDistributionChartProps {
  devices: Device[];
}

const OS_COLORS: Record<string, string> = {
  Android: "#3DDC84",
  Linux: "#FCC624",
  Windows: "#0078D4",
  "Custom Firmware": "#FF6B6B",
  Unknown: "#95A5A6",
};

function getOSColor(os: string): string {
  return OS_COLORS[os] ?? `hsl(${os.length * 37 % 360}, 70%, 50%)`;
}

function categorizeOS(device: Device): string {
  const osList = device.os?.list ?? [];
  const customFirmwares = device.os?.customFirmwares ?? [];

  if (osList.length > 0) {
    const os = osList[0].toLowerCase();
    if (os.includes("android")) return "Android";
    if (os.includes("linux")) return "Linux";
    if (os.includes("windows")) return "Windows";
    if (
      os.includes("retroarch") ||
      os.includes("emuelec") ||
      os.includes("batocera")
    ) {
      return "Custom Firmware";
    }
    if (customFirmwares.length > 0) return "Custom Firmware";
    return osList[0]?.trim() ? osList[0] : "Unknown";
  }
  if (customFirmwares.length > 0) return "Custom Firmware";
  return "Unknown";
}

function describeArc(
  cx: number,
  cy: number,
  r: number,
  startAngle: number,
  endAngle: number
): string {
  const start = polarToCartesian(cx, cy, r, endAngle);
  const end = polarToCartesian(cx, cy, r, startAngle);
  const largeArc = endAngle - startAngle <= 180 ? "0" : "1";
  return [
    "M",
    cx,
    cy,
    "L",
    start.x,
    start.y,
    "A",
    r,
    r,
    0,
    largeArc,
    1,
    end.x,
    end.y,
    "Z",
  ].join(" ");
}

function polarToCartesian(
  cx: number,
  cy: number,
  r: number,
  angleDeg: number
): { x: number; y: number } {
  const rad = (angleDeg * Math.PI) / 180;
  return {
    x: cx + r * Math.cos(rad),
    y: cy - r * Math.sin(rad),
  };
}

const PIE_SIZE = 180;
const PIE_R = PIE_SIZE / 2 - 8;

export function OSDistributionChart({ devices }: OSDistributionChartProps) {
  const segments = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const d of devices) {
      const os = categorizeOS(d);
      counts[os] = (counts[os] ?? 0) + 1;
    }
    const total = devices.length;
    if (total === 0) return [];

    const sorted = Object.entries(counts).sort(([, a], [, b]) => b - a);
    const unknownCount = counts["Unknown"] ?? 0;

    // Major segments: OS with more devices than Unknown
    const major = sorted.filter(([, count]) => count > unknownCount);
    // Unknown + everything smaller: one combined segment (fewer legend lines)
    const otherCount = sorted
      .filter(([, count]) => count <= unknownCount)
      .reduce((sum, [, count]) => sum + count, 0);

    const parts: { os: string; count: number; color: string }[] = [
      ...major.map(([os, count]) => ({
        os,
        count,
        color: getOSColor(os),
      })),
      ...(otherCount > 0
        ? [
            {
              os: "Unknown & other",
              count: otherCount,
              color: OS_COLORS["Unknown"],
            },
          ]
        : []),
    ];

    let startAngle = 0;
    return parts.map(({ os, count, color }) => {
      const pct = (count / total) * 100;
      const angleSpan = (count / total) * 360;
      const endAngle = startAngle + angleSpan;
      const segment = {
        os,
        count,
        pct,
        color,
        startAngle,
        endAngle,
      };
      startAngle = endAngle;
      return segment;
    });
  }, [devices]);

  const cx = PIE_SIZE / 2;
  const cy = PIE_SIZE / 2;

  if (segments.length === 0) {
    return (
      <Box
        height={PIE_SIZE + 80}
        justifyContent="center"
        alignItems="center"
        bg={colors.backgroundCard}
        borderRadius="md"
      >
        <Text color={colors.textTertiary}>No OS data</Text>
      </Box>
    );
  }

  return (
    <Box p={2}>
      <View style={{ alignSelf: "center" }}>
        <Svg width={PIE_SIZE} height={PIE_SIZE} viewBox={`0 0 ${PIE_SIZE} ${PIE_SIZE}`}>
          {segments.map((seg, i) => (
            <Path
              key={seg.os}
              d={describeArc(cx, cy, PIE_R, seg.startAngle, seg.endAngle)}
              fill={seg.color}
              stroke={colors.backgroundCard}
              strokeWidth={2}
            />
          ))}
        </Svg>
      </View>
      <VStack space={2} mt={4}>
        {segments.map((seg) => (
          <HStack key={seg.os} alignItems="center" space={3}>
            <View
              style={{
                width: 12,
                height: 12,
                borderRadius: 6,
                backgroundColor: seg.color,
              }}
            />
            <Text color={colors.textPrimary} flex={1}>
              {seg.os}
            </Text>
            <Text color={colors.textSecondary}>
              {seg.count} ({seg.pct.toFixed(1)}%)
            </Text>
          </HStack>
        ))}
      </VStack>
    </Box>
  );
}
