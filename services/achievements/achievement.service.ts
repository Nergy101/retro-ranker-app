import {
  createPocketBaseService,
  PocketBaseService,
} from "../pocketbase/pocketbase.service";
import {
  AchievementMetrics,
  AchievementMetricKey,
} from "../../types/achievement.contract";
import { checkAchievements } from "./achievement.api";

export class AchievementService {
  private pb: PocketBaseService;

  constructor() {
    this.pb = createPocketBaseService();
  }

  /**
   * Check and unlock achievements for a user based on their current metrics
   * This calls the backend API which has superuser access
   */
  async checkAndUnlockAchievements(userId: string): Promise<string[]> {
    try {
      console.log(`Checking achievements for user: ${userId}`);

      // Get user's current metrics
      const metrics = await this.getUserMetrics(userId);
      console.log("User metrics:", metrics);

      // Get currently unlocked achievements
      const unlockedAchievementIds =
        await this.getUnlockedAchievementIds(userId);
      console.log("Currently unlocked achievements:", unlockedAchievementIds);

      // Call backend API to check and unlock achievements
      // The backend has superuser access to create user_achievements records
      const result = await checkAchievements(userId);

      if (result.success) {
        console.log(
          "Newly unlocked achievements:",
          result.unlockedAchievements,
        );
        return result.unlockedAchievements;
      } else {
        console.error("Achievement check failed:", result.error);
        return [];
      }
    } catch (error) {
      console.error("Failed to check achievements:", error);
      return [];
    }
  }

  /**
   * Get user's current achievement metrics
   */
  async getUserMetrics(userId: string): Promise<AchievementMetrics> {
    const [
      collections,
      favoritedDevices,
      commentCount,
      reviewCount,
      replyCount,
      reactionCount,
    ] = await Promise.all([
      this.getUserCollections(userId),
      this.getUserFavorites(userId),
      this.getUserCommentCount(userId),
      this.getUserReviewCount(userId),
      this.getUserReplyCount(userId),
      this.getUserReactionCount(userId),
    ]);

    const ownedDeviceIds = new Set(
      collections.flatMap((collection) =>
        collection.devices.map((d: any) => d.id),
      ),
    );

    return {
      ownedDeviceCount: ownedDeviceIds.size,
      collectionCount: collections.length,
      favoritesCount: favoritedDevices.length,
      commentCount,
      reviewCount,
      commentReplyCount: replyCount,
      commentReactionCount: reactionCount,
    };
  }

  private async getUserCollections(userId: string) {
    try {
      const collections = await this.pb.getList("device_collections", 1, 100, {
        filter: `owner = "${userId}"`,
        expand: "devices",
        sort: "-created",
      });
      return collections.items.map((c) => ({
        id: c.id,
        name: c.name,
        description: c.description,
        devices: (c.expand?.devices ?? []).map((d: any) => ({
          id: d.id,
          name: d.name,
        })),
        deviceCount: (c.expand?.devices ?? []).length,
      }));
    } catch (error) {
      console.error("Failed to fetch user collections:", error);
      return [];
    }
  }

  private async getUserFavorites(userId: string) {
    try {
      const favorites = await this.pb.getList("device_favorites", 1, 100, {
        filter: `user = "${userId}"`,
        expand: "device",
        sort: "-created",
      });
      return favorites.items.map((f: any) => f.expand?.device);
    } catch (error) {
      console.error("Failed to fetch user favorites:", error);
      return [];
    }
  }

  private async getUserCommentCount(userId: string): Promise<number> {
    try {
      const comments = await this.pb.getList("device_comments", 1, 1, {
        filter: `user = "${userId}" && parent_comment = ""`,
        sort: "-created",
        expand: "",
      });
      return comments.totalItems ?? comments.items.length ?? 0;
    } catch (error) {
      console.error("Failed to fetch user comment count:", error);
      return 0;
    }
  }

  private async getUserReviewCount(userId: string): Promise<number> {
    try {
      const reviews = await this.pb.getList("device_reviews", 1, 1, {
        filter: `user = "${userId}"`,
        sort: "-created",
        expand: "",
      });
      const count = reviews.totalItems ?? reviews.items.length ?? 0;
      return count;
    } catch (error) {
      console.error("Failed to fetch user review count:", error);
      return 0;
    }
  }

  private async getUserReplyCount(userId: string): Promise<number> {
    try {
      const replies = await this.pb.getList("device_comments", 1, 1, {
        filter: `user = "${userId}" && parent_comment != ""`,
        sort: "-created",
        expand: "",
      });
      return replies.totalItems ?? replies.items.length ?? 0;
    } catch (error) {
      console.error("Failed to fetch user reply count:", error);
      return 0;
    }
  }

  private async getUserReactionCount(userId: string): Promise<number> {
    try {
      const reactions = await this.pb.getList("comment_reactions", 1, 1, {
        filter: `user = "${userId}"`,
        sort: "-created",
        expand: "",
      });
      return reactions.totalItems ?? reactions.items.length ?? 0;
    } catch (error) {
      console.error("Failed to fetch user reaction count:", error);
      return 0;
    }
  }

  async getUnlockedAchievementIds(userId: string): Promise<string[]> {
    try {
      const result = await this.pb.getList("user_achievements", 1, 200, {
        filter: `user = "${userId}"`,
        sort: "-created",
        expand: "",
      });
      return result.items.map((record) => record.achievement);
    } catch (error) {
      console.error("Failed to fetch unlocked achievements:", error);
      return [];
    }
  }
}
