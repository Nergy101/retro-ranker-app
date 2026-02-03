/**
 * App-wide constants
 */

export const POCKETBASE_URL = process.env.EXPO_PUBLIC_POCKETBASE_URL ||
  "https://pocketbase.retroranker.site";

export const API_BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL ||
  "https://retroranker.site";

export const CACHE_DURATION_MS = 30 * 60 * 1000; // 30 minutes

export const DEFAULT_PAGE_SIZE = 9;
export const DEFAULT_PAGE_SIZE_LIST = 20;
export const DEFAULT_PAGE_SIZE_GRID_4 = 4;

/** Minimum top padding (px). Safe area top is used when larger (e.g. iOS notch/dynamic island). */
export const SAFE_AREA_TOP_PADDING_MIN = 32;
