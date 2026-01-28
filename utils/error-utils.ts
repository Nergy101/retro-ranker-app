import { ClientResponseError } from "pocketbase";

export interface RateLimitInfo {
  retryAfterMinutes: number;
  message: string;
}

/**
 * Check if an error is a rate limit (429) error
 */
export function isRateLimitError(error: unknown): boolean {
  if (error instanceof ClientResponseError) {
    return error.status === 429;
  }
  return false;
}

/**
 * Extract rate limit information from an error
 */
export function getRateLimitInfo(error: unknown): RateLimitInfo | null {
  if (!(error instanceof ClientResponseError)) {
    return null;
  }

  if (error.status === 429) {
    // Try to extract Retry-After header (in seconds)
    // PocketBase ClientResponseError may have headers in different places
    let retryAfterHeader: string | null = null;
    
    // Try to get from response headers
    if (error.response?.headers) {
      if (typeof error.response.headers.get === "function") {
        retryAfterHeader = error.response.headers.get("retry-after");
      } else if (error.response.headers["retry-after"]) {
        retryAfterHeader = error.response.headers["retry-after"];
      }
    }

    let retryAfterMinutes = 5; // Default to 5 minutes

    if (retryAfterHeader) {
      const retryAfterSeconds = parseInt(retryAfterHeader, 10);
      if (!isNaN(retryAfterSeconds)) {
        // Convert seconds to minutes, round up
        retryAfterMinutes = Math.ceil(retryAfterSeconds / 60);
        // Ensure minimum of 1 minute
        retryAfterMinutes = Math.max(1, retryAfterMinutes);
      }
    }

    return {
      retryAfterMinutes,
      message: error.message || "Too many requests. Please try again later.",
    };
  }

  return null;
}

/**
 * Get a user-friendly error message from any error
 */
export function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }
  if (typeof error === "string") {
    return error;
  }
  return "An unexpected error occurred";
}
