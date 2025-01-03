import { supabase } from '../utils/supabase';

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
  private static instance: LeaderboardService;

  private constructor() {}

  public static getInstance(): LeaderboardService {
    if (!LeaderboardService.instance) {
      LeaderboardService.instance = new LeaderboardService();
    }
    return LeaderboardService.instance;
  }

  public async getLeaderboard(date: string): Promise<LeaderboardEntry[]> {
    const { data, error } = await supabase
      .from('health_metrics')
      .select(`
        user_id,
        steps,
        distance,
        score,
        users (
          display_name,
          photo_url
        )
      `)
      .eq('date', date)
      .order('score', { ascending: false });

    if (error) throw error;

    if (!data) return [];

    return data.map((entry, index) => ({
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
      .from('health_metrics')
      .select('score')
      .eq('date', date)
      .order('score', { ascending: false });

    if (error) throw error;
    if (!data) return null;

    const userIndex = data.findIndex(entry => entry.user_id === userId);
    return userIndex === -1 ? null : userIndex + 1;
  }

  public async getWeeklyLeaderboard(startDate: string, endDate: string): Promise<LeaderboardEntry[]> {
    const { data, error } = await supabase
      .from('health_metrics')
      .select(`
        user_id,
        steps,
        distance,
        score,
        users (
          display_name,
          photo_url
        )
      `)
      .gte('date', startDate)
      .lte('date', endDate);

    if (error) throw error;
    if (!data) return [];

    // Aggregate scores by user
    const userScores = data.reduce((acc, entry) => {
      const userId = entry.user_id;
      if (!acc[userId]) {
        acc[userId] = {
          user_id: userId,
          display_name: entry.users?.display_name || 'Unknown User',
          photo_url: entry.users?.photo_url || null,
          steps: 0,
          distance: 0,
          score: 0
        };
      }
      acc[userId].steps += entry.steps || 0;
      acc[userId].distance += entry.distance || 0;
      acc[userId].score += entry.score || 0;
      return acc;
    }, {} as Record<string, Omit<LeaderboardEntry, 'rank'>>);

    // Convert to array and sort by score
    return Object.values(userScores)
      .sort((a, b) => b.score - a.score)
      .map((entry, index) => ({
        ...entry,
        rank: index + 1
      }));
  }
}

export default LeaderboardService.getInstance();
