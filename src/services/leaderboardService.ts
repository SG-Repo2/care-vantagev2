import { supabase } from '../utils/supabase';

import { PrivacyLevel } from '../core/types/base';

interface UserProfile {
  display_name: string;
  photo_url: string | null;
  settings: {
    privacyLevel: PrivacyLevel;
  };
}

interface HealthMetric {
  user_id: string;
  steps: number;
  distance: number;
  score: number;
  users: UserProfile | null;
}

interface WeeklyHealthMetric {
  user_id: string;
  steps: number;
  distance: number;
  score: number;
  users: UserProfile | null;
}

interface HealthMetricScore {
  user_id: string;
  score: number;
  users: UserProfile | null;
}

export interface LeaderboardEntry {
  user_id: string;
  display_name: string;
  photo_url: string | null;
  steps: number;
  distance: number;
  score: number;
  rank?: number;
}

class LeaderboardService {
  constructor() {}

  public async getLeaderboard(date: string): Promise<LeaderboardEntry[]> {
    // Use the same pattern as weekly leaderboard for consistency
    const { data, error } = await supabase
      .rpc('get_daily_leaderboard', {
        target_date: date
      });

    if (error) throw error;
    if (!data) return [];

    return data.map((entry: HealthMetric, index: number) => ({
      user_id: entry.user_id,
      display_name: entry.users?.display_name || 'Unknown User',
      photo_url: entry.users?.photo_url || null,
      steps: entry.steps || 0,
      distance: entry.distance || 0,
      score: entry.score || 0,
      rank: index + 1
    }));
  }

  public async getUserRank(userId: string, date: string): Promise<number | null> {
    const { data, error } = await supabase
      .rpc('get_user_rank', {
        user_uuid: userId,
        target_date: date
      });

    if (error) throw error;
    return data;
  }

  public async getWeeklyLeaderboard(startDate: string, endDate: string): Promise<LeaderboardEntry[]> {
    const { data, error } = await supabase
      .rpc('get_weekly_leaderboard', {
        start_date: startDate,
        end_date: endDate
      });

    if (error) throw error;
    if (!data) return [];

    // Map the data to LeaderboardEntry format
    return data.map((entry: WeeklyHealthMetric, index: number) => ({
      user_id: entry.user_id,
      display_name: entry.users?.display_name || 'Unknown User',
      photo_url: entry.users?.photo_url || null,
      steps: entry.steps || 0,
      distance: entry.distance || 0,
      score: entry.score || 0,
      rank: index + 1
    }));
  }
}

export default new LeaderboardService();
