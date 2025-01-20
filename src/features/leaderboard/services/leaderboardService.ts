import { supabase } from '../../../utils/supabase';
import { PrivacyLevel } from '../../../core/types/base';
import debounce from 'lodash/debounce';

export interface LeaderboardEntry {
  public_id: string;
  display_name: string;
  photo_url: string | null;
  score: number;
  rank: number;
}

class LeaderboardService {
  private static CACHE_TIME = 30000; // 30 seconds
  private static PAGE_SIZE = 50;
  
  async getLeaderboard(page = 1): Promise<LeaderboardEntry[]> {
    const start = (page - 1) * LeaderboardService.PAGE_SIZE;
    const end = page * LeaderboardService.PAGE_SIZE - 1;

    const { data, error } = await supabase
      .from('leaderboard_public')
      .select('*')
      .range(start, end)
      .order('score', { ascending: false });

    if (error) throw error;
    return data || [];
  }

  async subscribeToUpdates(callback: (data: LeaderboardEntry[]) => void): Promise<{ unsubscribe: () => void }> {
    const channel = supabase.channel('leaderboard')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'users',
          filter: 'privacy_level IS NOT NULL OR score IS NOT NULL'
        },
        debounce(async () => {
          const result = await this.getLeaderboard(1);
          callback(result);
        }, 250)
      )
      .subscribe();

    return {
      unsubscribe: () => {
        channel.unsubscribe();
      }
    };
  }

  async updateScore(userId: string, newScore: number): Promise<void> {
    try {
      const { error } = await supabase
        .from('users')
        .update({ 
          score: newScore,
          updated_at: new Date().toISOString()
        })
        .eq('id', userId);

      if (error) throw error;
    } catch (error) {
      console.error('Error updating score:', error);
      throw error;
    }
  }
}

export const leaderboardService = new LeaderboardService();
