/**
 * App-wide constants
 */

export const POCKETBASE_URL = process.env.EXPO_PUBLIC_POCKETBASE_URL ||
  "https://pocketbase.retroranker.site";

export const CACHE_DURATION_MS = 30 * 60 * 1000; // 30 minutes

export const DEFAULT_PAGE_SIZE = 9;
export const DEFAULT_PAGE_SIZE_LIST = 20;
export const DEFAULT_PAGE_SIZE_GRID_4 = 4;
