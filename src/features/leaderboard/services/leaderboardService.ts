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
      // Get today's date in YYYY-MM-DD format
      const today = new Date().toISOString().split('T')[0];

      // Fetch users with their latest health scores, ordered by daily_score descending
      const { data, error } = await supabase
        .from('users')
        .select(`
          id,
          display_name,
          health_scores (
            daily_score,
            date
          )
        `)
        .eq('health_scores.date', today)
        .order('health_scores.daily_score', { ascending: false });

      if (error) {
        throw error;
      }

      // Transform the data to match LeaderboardEntry interface
      // Filter out users without health scores and map to leaderboard entries
      return (data || [])
        .filter(entry => entry.health_scores && entry.health_scores.length > 0)
        .map((entry, index) => ({
          id: entry.id,
          user_id: entry.id,
          display_name: entry.display_name || 'Anonymous User',
          score: entry.health_scores[0].daily_score,
          rank: index + 1,
          created_at: new Date().toISOString()
        }));
    } catch (error) {
      console.error('Error fetching leaderboard:', error);
      throw error;
    }
  }

  async updateScore(userId: string, newScore: number): Promise<void> {
    try {
      const today = new Date().toISOString().split('T')[0];

      const { error } = await supabase
        .from('health_scores')
        .upsert({
          user_id: userId,
          date: today,
          daily_score: newScore
        }, {
          onConflict: 'user_id,date'
        });

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
