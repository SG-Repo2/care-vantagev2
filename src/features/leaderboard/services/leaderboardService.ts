import { supabase } from '../../../utils/supabase';
import type { LeaderboardUser } from '../types';

export const leaderboardService = {
  /**
   * Fetch users sorted by score in descending order
   */
  async getLeaderboard(): Promise<LeaderboardUser[]> {
    const { data, error } = await supabase
      .from('users')
      .select('id, display_name, photo_url, score')
      .not('score', 'is', null)
      .order('score', { ascending: false })
      .limit(50);

    if (error) {
      throw new Error(`Failed to fetch leaderboard: ${error.message}`);
    }

    return (data as LeaderboardUser[]) || [];
  }
};
