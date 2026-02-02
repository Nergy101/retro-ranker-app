/**
 * Shared chart color palette and variants for all Charts page graphs.
 * Bright, distinct colors with darker (stroke) and lighter (fill) variants
 * so every line/segment gets its own color and stands out on dark backgrounds.
 */

// Bright, distinct base colors (hex) — good contrast on dark theme, spread across the hue wheel
const CHART_PALETTE: string[] = [
  "#ff9500", // orange (primary)
  "#00c7be", // teal
  "#ff3b30", // red
  "#5856d6", // violet
  "#34c759", // green
  "#af52de", // purple
  "#ffcc00", // yellow
  "#007aff", // blue
  "#ff6482", // pink
  "#00b4d8", // cyan
  "#30d158", // mint
  "#bf5af2", // magenta
  "#ff9f0a", // amber
  "#64d2ff", // light blue
  "#ffd60a", // gold
  "#ff375f", // coral
  "#32ade6", // sky
  "#7ed321", // lime
];

function hexToRgb(hex: string): { r: number; g: number; b: number } {
  const n = hex.replace("#", "");
  const r = parseInt(n.slice(0, 2), 16);
  const g = parseInt(n.slice(2, 4), 16);
  const b = parseInt(n.slice(4, 6), 16);
  return { r, g, b };
}

function rgbToHsl(
  r: number,
  g: number,
  b: number
): { h: number; s: number; l: number } {
  r /= 255;
  g /= 255;
  b /= 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h = 0;
  let s = 0;
  const l = (max + min) / 2;
  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r:
        h = (g - b) / d + (g < b ? 6 : 0);
        break;
      case g:
        h = (b - r) / d + 2;
        break;
      default:
        h = (r - g) / d + 4;
    }
    h /= 6;
  }
  return { h: h * 360, s: s * 100, l: l * 100 };
}

function hslToRgb(
  h: number,
  s: number,
  l: number
): { r: number; g: number; b: number } {
  h /= 360;
  s /= 100;
  l /= 100;
  let r: number, g: number, b: number;
  if (s === 0) {
    r = g = b = l;
  } else {
    const hue2rgb = (p: number, q: number, t: number) => {
      if (t < 0) t += 1;
      if (t > 1) t -= 1;
      if (t < 1 / 6) return p + (q - p) * 6 * t;
      if (t < 1 / 2) return q;
      if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
      return p;
    };
    const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
    const p = 2 * l - q;
    r = hue2rgb(p, q, h + 1 / 3);
    g = hue2rgb(p, q, h);
    b = hue2rgb(p, q, h - 1 / 3);
  }
  return { r: Math.round(r * 255), g: Math.round(g * 255), b: Math.round(b * 255) };
}

function rgbToHex(r: number, g: number, b: number): string {
  return (
    "#" +
    [r, g, b]
      .map((x) => Math.max(0, Math.min(255, Math.round(x))).toString(16).padStart(2, "0"))
      .join("")
  );
}

/** Darken a hex color by reducing lightness (for strokes, borders). */
function darken(hex: string, amount: number): string {
  const { r, g, b } = hexToRgb(hex);
  const { h, s, l } = rgbToHsl(r, g, b);
  const newL = Math.max(0, l - amount);
  const { r: nr, g: ng, b: nb } = hslToRgb(h, s, newL);
  return rgbToHex(nr, ng, nb);
}

/** Lighten a hex color by increasing lightness (for fills, areas). */
function lighten(hex: string, amount: number): string {
  const { r, g, b } = hexToRgb(hex);
  const { h, s, l } = rgbToHsl(r, g, b);
  const newL = Math.min(100, l + amount);
  const { r: nr, g: ng, b: nb } = hslToRgb(h, s, newL);
  return rgbToHex(nr, ng, nb);
}

/** Get base color for a chart series/segment by index. Wraps around the palette. */
export function getChartColor(index: number): string {
  return CHART_PALETTE[index % CHART_PALETTE.length] ?? CHART_PALETTE[0];
}

/** Darker variant of the chart color (e.g. for strokes, borders). */
export function getChartColorDark(index: number): string {
  return darken(getChartColor(index), 12);
}

/** Lighter variant of the chart color (e.g. for fills, areas). */
export function getChartColorLight(index: number): string {
  return lighten(getChartColor(index), 15);
}

/** Full set: base (main), dark (stroke), light (fill). */
export function getChartColorSet(index: number): {
  base: string;
  dark: string;
  light: string;
} {
  const base = getChartColor(index);
  return {
    base,
    dark: darken(base, 12),
    light: lighten(base, 15),
  };
}

/** Stable color by string key (e.g. brand name, OS name). Same key always gets same color. */
export function getChartColorByKey(key: string, indexFallback: number): string {
  const index = keyToIndex(key, indexFallback);
  return getChartColor(index);
}

/** Same as getChartColorByKey but returns full set (base, dark, light). */
export function getChartColorSetByKey(
  key: string,
  indexFallback: number
): { base: string; dark: string; light: string } {
  const index = keyToIndex(key, indexFallback);
  return getChartColorSet(index);
}

function keyToIndex(key: string, indexFallback: number): number {
  if (!key || !key.trim()) return indexFallback;
  let hash = 0;
  for (let i = 0; i < key.length; i++) {
    hash = key.charCodeAt(i) + ((hash << 5) - hash);
  }
  return Math.abs(hash) % Math.max(1, CHART_PALETTE.length);
}
