import React, { useMemo } from "react";
import { Dimensions, View } from "react-native";
import Svg, { Circle, Line, Path, Text as SvgText } from "react-native-svg";
import { Box, HStack, Text } from "native-base";
import { Device } from "../../types/device.model";
import { colors } from "../../theme/colors";

interface DevicesPerBrandPerYearChartProps {
  devices: Device[];
}

const CHART_HEIGHT = 220;
const PAD_LEFT = 28;
const PAD_RIGHT = 28;
const PAD_TOP = 16;
const PAD_BOTTOM = 28;
const GRID_COUNT = 4;
const MIN_YEAR = 2020;
const MIN_DEVICES_PER_BRAND = 10;

// One blue, one pink; no purples or light blues
const BRAND_PALETTE = [
  "#ff9500", // orange (primary)
  "#e11d48", // red
  "#eab308", // yellow
  "#84cc16", // lime
  "#22c55e", // green
  "#10b981", // emerald
  "#2563eb", // blue
  "#ec4899", // pink
  "#f59e0b", // amber
  "#ea580c", // dark orange
];

function getBrandColor(brandKey: string, index: number): string {
  let hash = 0;
  for (let i = 0; i < brandKey.length; i++) {
    hash = brandKey.charCodeAt(i) + ((hash << 5) - hash);
  }
  const paletteIndex = Math.abs(hash) % BRAND_PALETTE.length;
  return BRAND_PALETTE[paletteIndex] ?? BRAND_PALETTE[index % BRAND_PALETTE.length];
}

function pointsToPath(points: { x: number; y: number }[]): string {
  if (points.length === 0) return "";
  if (points.length === 1) return `M ${points[0].x},${points[0].y}`;
  return points.reduce((path, point, i) => {
    if (i === 0) return `M ${point.x},${point.y}`;
    const prev = points[i - 1];
    const c1x = prev.x + (point.x - prev.x) / 3;
    const c2x = prev.x + (2 * (point.x - prev.x)) / 3;
    return `${path} C ${c1x},${prev.y} ${c2x},${point.y} ${point.x},${point.y}`;
  }, "");
}

export function DevicesPerBrandPerYearChart({
  devices,
}: DevicesPerBrandPerYearChartProps) {
  const chartWidth = Dimensions.get("window").width - 32;
  const plotWidth = chartWidth - PAD_LEFT - PAD_RIGHT;
  const plotHeight = CHART_HEIGHT - PAD_TOP - PAD_BOTTOM;

  const { years, series, maxVal, minVal, yTicks } = useMemo(() => {
    const yearSet = new Set<number>();
    for (const d of devices) {
      const date = d.released?.mentionedDate;
      if (date) {
        const year = new Date(date).getFullYear();
        if (!Number.isNaN(year) && year >= MIN_YEAR) yearSet.add(year);
      }
    }
    const years = Array.from(yearSet).sort((a, b) => a - b);
    if (years.length === 0) {
      return {
        years: [] as number[],
        series: [] as { brand: string; color: string; points: { x: number; y: number; value: number }[] }[],
        maxVal: 0,
        minVal: 0,
        yTicks: [0],
      };
    }

    const brandCounts: Record<string, number> = {};
    for (const d of devices) {
      const brand = d.brand?.raw?.trim() || d.brand?.sanitized || "Unknown";
      if (!brand || brand === "Unknown") continue;
      brandCounts[brand] = (brandCounts[brand] ?? 0) + 1;
    }
    const brandsWithEnough = Object.entries(brandCounts)
      .filter(([, count]) => count >= MIN_DEVICES_PER_BRAND)
      .sort(([, a], [, b]) => b - a)
      .map(([brand]) => brand);

    const series: { brand: string; color: string; points: { x: number; y: number; value: number }[] }[] = [];
    let maxVal = 0;
    const minVal = 0;

    for (let i = 0; i < brandsWithEnough.length; i++) {
      const brand = brandsWithEnough[i];
      const color = getBrandColor(brand, i);
      const counts = years.map((year) =>
        devices.filter((d) => {
          const date = d.released?.mentionedDate;
          if (!date) return false;
          const y = new Date(date).getFullYear();
          const b = d.brand?.raw?.trim() || d.brand?.sanitized || "";
          return y === year && b === brand;
        }).length
      );
      const range = Math.max(...counts, 1) - minVal;
      const plotRange = range || 1;
      const points = counts.map((value, index) => ({
        x:
          PAD_LEFT +
          (years.length === 1 ? plotWidth / 2 : (index / (years.length - 1)) * plotWidth),
        y: PAD_TOP + plotHeight - ((value - minVal) / plotRange) * plotHeight,
        value,
      }));
      series.push({ brand, color, points });
      counts.forEach((c) => {
        if (c > maxVal) maxVal = c;
      });
    }

    maxVal = Math.max(maxVal, 1);
    const step = Math.max(1, Math.ceil(maxVal / GRID_COUNT));
    const yTicks = Array.from({ length: GRID_COUNT + 1 }, (_, i) => Math.min(i * step, maxVal));
    if (yTicks[yTicks.length - 1] !== maxVal && maxVal > 0) yTicks.push(maxVal);

    const range = maxVal - minVal || 1;
    const seriesWithScaledPoints = series.map((s) => ({
      ...s,
      points: s.points.map((p) => ({
        ...p,
        y: PAD_TOP + plotHeight - ((p.value - minVal) / range) * plotHeight,
      })),
    }));

    return {
      years,
      series: seriesWithScaledPoints,
      maxVal,
      minVal,
      yTicks,
    };
  }, [devices, plotWidth, plotHeight]);

  if (years.length === 0 || series.length === 0) {
    return (
      <Box
        height={CHART_HEIGHT}
        justifyContent="center"
        alignItems="center"
        bg={colors.backgroundCard}
        borderRadius="md"
      >
        <Text color={colors.textTertiary}>
          {years.length === 0
            ? "No data from 2020 onward"
            : "No brands with ≥10 devices in this range"}
        </Text>
      </Box>
    );
  }

  const range = maxVal - minVal || 1;

  return (
    <Box>
      <View style={{ width: chartWidth, height: CHART_HEIGHT }}>
        <Svg width={chartWidth} height={CHART_HEIGHT}>
          {/* Grid lines */}
          {yTicks.map((val, i) => {
            const y =
              PAD_TOP + plotHeight - ((val - minVal) / range) * plotHeight;
            return (
              <Line
                key={`grid-${i}`}
                x1={PAD_LEFT}
                y1={y}
                x2={chartWidth - PAD_RIGHT}
                y2={y}
                stroke={colors.border}
                strokeWidth={1}
                strokeDasharray="4,4"
                opacity={0.5}
              />
            );
          })}
          {/* Y-axis labels */}
          {yTicks.map((val, i) => {
            const y =
              PAD_TOP + plotHeight - ((val - minVal) / range) * plotHeight;
            return (
              <SvgText
                key={`ylabel-${i}`}
                x={PAD_LEFT - 6}
                y={y + 4}
                textAnchor="end"
                fill={colors.textSecondary}
                fontSize={11}
                fontWeight="500"
              >
                {val}
              </SvgText>
            );
          })}
          {/* Lines and dots per brand */}
          {series.map((s, idx) => (
            <React.Fragment key={s.brand}>
              <Path
                d={pointsToPath(s.points)}
                fill="none"
                stroke={s.color}
                strokeWidth={2}
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              {s.points.map((point, i) => (
                <Circle
                  key={`${idx}-${i}`}
                  cx={point.x}
                  cy={point.y}
                  r={3}
                  fill={colors.backgroundCard}
                  stroke={s.color}
                  strokeWidth={2}
                />
              ))}
            </React.Fragment>
          ))}
          {/* X-axis labels (years) */}
          {series[0].points.map((point, index) => (
            <SvgText
              key={index}
              x={point.x}
              y={CHART_HEIGHT - 8}
              textAnchor="middle"
              fill={colors.textSecondary}
              fontSize={11}
            >
              {years[index]}
            </SvgText>
          ))}
        </Svg>
      </View>
      {/* Legend: brand + color */}
      <Box mt={3} style={{ flexDirection: "row", flexWrap: "wrap" }}>
        {series.map((s) => (
          <HStack key={s.brand} alignItems="center" mr={4} mb={1.5}>
            <View
              style={{
                width: 10,
                height: 10,
                borderRadius: 2,
                backgroundColor: s.color,
              }}
            />
            <Text color={colors.textPrimary} fontSize="xs" ml={1.5}>
              {s.brand}
            </Text>
          </HStack>
        ))}
      </Box>
    </Box>
  );
}
