const API_BASE_URL = "https://retroranker.site";

export interface AchievementCheckResponse {
  success: boolean;
  unlockedAchievements: string[];
  message?: string;
  error?: string;
}

/**
 * Check and unlock achievements for a user
 * Calls the backend API endpoint which handles superuser operations
 */
export async function checkAchievements(
  userId: string,
  authToken?: string,
): Promise<AchievementCheckResponse> {
  try {
    const headers: HeadersInit = {
      "Content-Type": "application/json",
    };

    if (authToken) {
      headers["Authorization"] = `Bearer ${authToken}`;
    }

    const response = await fetch(`${API_BASE_URL}/api/achievements/check`, {
      method: "POST",
      headers,
      body: JSON.stringify({ userId }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Achievement check failed: ${errorText}`);
    }

    const data = await response.json();
    return data as AchievementCheckResponse;
  } catch (error) {
    console.error("Error checking achievements:", error);
    return {
      success: false,
      unlockedAchievements: [],
      error: error instanceof Error ? error.message : String(error),
    };
  }
}
