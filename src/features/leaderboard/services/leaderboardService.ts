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
      // Fetch users ordered by score descending
      const { data, error } = await supabase
        .from('users')
        .select('id, display_name, score')
        .not('score', 'is', null)
        .order('score', { ascending: false });

      if (error) {
        throw error;
      }

      // Transform the data and add rank based on array index
      return (data || []).map((entry, index) => ({
        id: entry.id,
        user_id: entry.id,
        display_name: entry.display_name || 'Anonymous User',
        score: entry.score || 0,
        rank: index + 1, // Rank is based on array position (0-based, so add 1)
        created_at: new Date().toISOString()
      }));
    } catch (error) {
      console.error('Error fetching leaderboard:', error);
      throw error;
    }
  }

  async updateScore(userId: string, newScore: number): Promise<void> {
    try {
      const { error } = await supabase
        .from('users')
        .update({ score: newScore })
        .eq('id', userId);

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
