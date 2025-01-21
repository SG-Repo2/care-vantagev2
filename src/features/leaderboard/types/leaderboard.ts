// src/features/leaderboard/types/leaderboard.ts
import { PrivacyLevel } from '../../../core/types/base';

export interface LeaderboardEntry {
  id: string;
  userId: string;
  displayName: string;
  dailyScore: number;
  weeklyScore?: number | null;
  rank: number;
  photoUrl: string | null;
  privacyLevel: PrivacyLevel;
  streakDays: number | null;
  isCurrentUser: boolean;
  steps?: number;
  distance?: number;
  calories?: number;
}

// Supabase query response type
export interface LeaderboardQueryResult {
  user_id: string;
  daily_score: number;
  weekly_score?: number;
  streak_days: number | null;
  steps?: number;
  distance?: number;
  calories?: number;
  users: {
    display_name: string | null;
    photo_url: string | null;
    privacy_level: PrivacyLevel;
  };
}

export interface LeaderboardOptions {
  page?: number;
  pageSize?: number;
  dateRange?: {
    start: string;
    end: string;
  };
}

export type LeaderboardTimeframe = 'daily' | 'weekly' | 'monthly';

export interface LeaderboardState {
  entries: LeaderboardEntry[];
  timeframe: LeaderboardTimeframe;
  loading: boolean;
  error: Error | null;
  hasMore: boolean;
  currentPage: number;
}





