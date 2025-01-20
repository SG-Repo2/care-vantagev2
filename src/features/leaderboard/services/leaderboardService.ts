import { supabase } from '../../../utils/supabase';

export interface LeaderboardEntry {
  public_id: string;
  display_name: string | null;
  photo_url: string | null;
  score: number;
  rank: number;
}

class LeaderboardService {
  private static PAGE_SIZE = 50;
  
  async getLeaderboard(page = 1): Promise<LeaderboardEntry[]> {
    const start = (page - 1) * LeaderboardService.PAGE_SIZE;
    const end = page * LeaderboardService.PAGE_SIZE - 1;

    const { data, error } = await supabase
      .from('leaderboard_public')
      .select('*')
      .range(start, end);

    if (error) throw error;
    return data || [];
  }

  async subscribeToUpdates(callback: (data: LeaderboardEntry[]) => void): Promise<{ unsubscribe: () => void }> {
    const channel = supabase.channel('leaderboard_updates')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'users'
        },
        async () => {
          // Whenever something changes in users, re-fetch the leaderboard
          const updated = await this.getLeaderboard(1);
          callback(updated);
        }
      )
      .subscribe();

    return {
      unsubscribe: () => channel.unsubscribe()
    };
  }

  async updateScore(userId: string, newScore: number): Promise<void> {
    const { error } = await supabase
      .from('users')
      .update({
        score: newScore,
        updated_at: new Date().toISOString()
      })
      .eq('id', userId);

    if (error) throw error;
  }
}

export const leaderboardService = new LeaderboardService();
