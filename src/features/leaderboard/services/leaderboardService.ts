import { supabase } from '../../../utils/supabase';

export interface LeaderboardEntry {
  id: string;
  user_id: string;
  display_name: string;
  score: number;
  rank?: number;
  created_at: string;
}

class LeaderboardService {
  async fetchLeaderboard(): Promise<LeaderboardEntry[]> {
    try {
      // Fetch profiles with their scores, ordered by score descending
      const { data, error } = await supabase
        .from('profiles')
        .select(`
          id,
          user_id,
          display_name,
          score,
          created_at
        `)
        .order('score', { ascending: false });

      if (error) {
        throw error;
      }

      // Add rank to each entry
      return (data || []).map((entry, index) => ({
        ...entry,
        rank: index + 1
      }));
    } catch (error) {
      console.error('Error fetching leaderboard:', error);
      throw error;
    }
  }

  async updateScore(userId: string, newScore: number): Promise<void> {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ score: newScore })
        .eq('user_id', userId);

      if (error) {
        throw error;
      }
    } catch (error) {
      console.error('Error updating score:', error);
      throw error;
    }
  }
}

export const leaderboardService = new LeaderboardService();
