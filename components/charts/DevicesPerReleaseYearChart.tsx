import React, { useMemo } from "react";
import { Dimensions, View } from "react-native";
import Svg, { Circle, Line, Path, Text as SvgText } from "react-native-svg";
import { Box, Text } from "native-base";
import { Device } from "../../types/device.model";
import { colors } from "../../theme/colors";

interface DevicesPerReleaseYearChartProps {
  devices: Device[];
}

const CHART_HEIGHT = 220;
const PAD_LEFT = 28;
const PAD_RIGHT = 28;
const PAD_TOP = 16;
const PAD_BOTTOM = 28;
const GRID_COUNT = 4;

export function DevicesPerReleaseYearChart({
  devices,
}: DevicesPerReleaseYearChartProps) {
  const MIN_YEAR = 2017;

  const { years, counts } = useMemo(() => {
    const yearSet = new Set<number>();
    for (const d of devices) {
      const date = d.released?.mentionedDate;
      if (date) {
        const year = new Date(date).getFullYear();
        if (!Number.isNaN(year) && year >= MIN_YEAR) yearSet.add(year);
      }
    }
    const years = Array.from(yearSet).sort((a, b) => a - b);
    const counts = years.map((year) => {
      return devices.filter((d) => {
        const date = d.released?.mentionedDate;
        if (!date) return false;
        return new Date(date).getFullYear() === year;
      }).length;
    });
    return { years, counts };
  }, [devices]);

  const chartWidth = Dimensions.get("window").width - 32;
  const plotWidth = chartWidth - PAD_LEFT - PAD_RIGHT;
  const plotHeight = CHART_HEIGHT - PAD_TOP - PAD_BOTTOM;

  const { points, maxVal, minVal, yTicks } = useMemo(() => {
    if (counts.length === 0) {
      return { points: [] as { x: number; y: number; value: number }[], maxVal: 0, minVal: 0, yTicks: [0] };
    }
    const maxVal = Math.max(...counts, 1);
    const minVal = 0;
    const range = maxVal - minVal || 1;
    const points = counts.map((value, index) => ({
      x:
        PAD_LEFT +
        (counts.length === 1 ? plotWidth / 2 : (index / (counts.length - 1)) * plotWidth),
      y: PAD_TOP + plotHeight - ((value - minVal) / range) * plotHeight,
      value,
    }));
    const step = Math.max(1, Math.ceil(maxVal / GRID_COUNT));
    const yTicks = Array.from({ length: GRID_COUNT + 1 }, (_, i) => Math.min(i * step, maxVal));
    const last = yTicks[yTicks.length - 1];
    if (last !== maxVal && maxVal > 0) yTicks.push(maxVal);
    return { points, maxVal, minVal, yTicks };
  }, [counts, plotWidth, plotHeight]);

  const linePath = useMemo(() => {
    if (points.length === 0) return "";
    if (points.length === 1) return `M ${points[0].x},${points[0].y}`;
    return points.reduce((path, point, i) => {
      if (i === 0) return `M ${point.x},${point.y}`;
      const prev = points[i - 1];
      const c1x = prev.x + (point.x - prev.x) / 3;
      const c2x = prev.x + (2 * (point.x - prev.x)) / 3;
      return `${path} C ${c1x},${prev.y} ${c2x},${point.y} ${point.x},${point.y}`;
    }, "");
  }, [points]);

  if (years.length === 0) {
    return (
      <Box
        height={CHART_HEIGHT}
        justifyContent="center"
        alignItems="center"
        bg={colors.backgroundCard}
        borderRadius="md"
      >
        <Text color={colors.textTertiary}>No release year data</Text>
      </Box>
    );
  }

  return (
    <View style={{ width: chartWidth, height: CHART_HEIGHT }}>
      <Svg width={chartWidth} height={CHART_HEIGHT}>
        {/* Grid lines */}
        {yTicks.map((val, i) => {
          const y = PAD_TOP + plotHeight - ((val - minVal) / (maxVal - minVal || 1)) * plotHeight;
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
        {/* Y-axis labels (count) */}
        {yTicks.map((val, i) => {
          const y = PAD_TOP + plotHeight - ((val - minVal) / (maxVal - minVal || 1)) * plotHeight;
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
        {/* Line */}
        <Path
          d={linePath}
          fill="none"
          stroke={colors.primary}
          strokeWidth={2}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        {/* Dots */}
        {points.map((point, index) => (
          <Circle
            key={index}
            cx={point.x}
            cy={point.y}
            r={4}
            fill={colors.backgroundCard}
            stroke={colors.primary}
            strokeWidth={2}
          />
        ))}
        {/* X-axis labels (years) */}
        {points.map((point, index) => (
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
  );
}
