export interface UserAchievementRecord {
  id: string;
  user: string;
  achievement: string;
  created: string;
  updated: string;
}

export type AchievementMetricKey =
  | "ownedDeviceCount"
  | "collectionCount"
  | "favoritesCount"
  | "commentCount"
  | "reviewCount"
  | "commentReplyCount"
  | "commentReactionCount";

export interface AchievementMetrics {
  ownedDeviceCount: number;
  collectionCount: number;
  favoritesCount: number;
  commentCount: number;
  reviewCount: number;
  commentReplyCount: number;
  commentReactionCount: number;
}

export interface AchievementStatus {
  id: string;
  name: string;
  description: string;
  icon: string;
  category: string;
  metric: AchievementMetricKey;
  threshold: number;
  lockedHint?: string;
  unlockedMessage?: string;
  unlocked: boolean;
  currentValue: number;
  progress: number;
  progressLabel: string;
  progressPercentage: number;
  remaining: number;
  statusText: string;
}
