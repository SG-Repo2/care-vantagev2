import { supabase } from '../../../utils/supabase';
import { DateUtils } from '../../../utils/DateUtils';
import { Logger } from '../../../utils/error/Logger';
import { SupabaseErrorHelper } from '../../../core/supabase/SupabaseErrorHelper';
import type { PrivacyLevel } from '../../../core/types/base';
import type {
  LeaderboardEntry,
  LeaderboardOptions,
  LeaderboardQueryResult,
  LeaderboardTimeframe
} from '../types/leaderboard';

class LeaderboardService {
  private static readonly PAGE_SIZE = 20;
  private static readonly DEFAULT_OPTIONS: LeaderboardOptions = {
    page: 1,
    pageSize: LeaderboardService.PAGE_SIZE
  };

  private getDateRangeForTimeframe(timeframe: LeaderboardTimeframe): { start: string; end: string } {
    const today = new Date();
    const end = DateUtils.getLocalDateString(today);
    
    switch (timeframe) {
      case 'weekly':
        const weekStart = new Date(today);
        weekStart.setDate(today.getDate() - 7);
        return { start: DateUtils.getLocalDateString(weekStart), end };
      case 'monthly':
        const monthStart = new Date(today);
        monthStart.setMonth(today.getMonth() - 1);
        return { start: DateUtils.getLocalDateString(monthStart), end };
      case 'daily':
      default:
        return { start: end, end };
    }
  }

  private async getCurrentUserId(): Promise<string | null> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      return user?.id ?? null;
    } catch (error) {
      Logger.error('Error getting current user:', { error });
      return null;
    }
  }

  async fetchLeaderboard(
    timeframe: LeaderboardTimeframe = 'daily',
    options: LeaderboardOptions = {}
  ): Promise<LeaderboardEntry[]> {
    try {
      const currentUserId = await this.getCurrentUserId();
      const dateRange = options.dateRange || this.getDateRangeForTimeframe(timeframe);
      const { page = 1, pageSize = LeaderboardService.PAGE_SIZE } = options;
      const start = (page - 1) * pageSize;
      const end = start + pageSize - 1;

      const query = supabase
        .from('health_metrics')
        .select(`
          user_id,
          daily_score,
          weekly_score,
          streak_days,
          steps,
          distance,
          calories,
          users!inner (
            display_name,
            photo_url,
            privacy_level
          )
        `)
        .gte('date', dateRange.start)
        .lte('date', dateRange.end)
        .not('daily_score', 'is', null)
        .order(timeframe === 'daily' ? 'daily_score' : 'weekly_score', { ascending: false })
        .range(start, end);

      const { data, error } = await query;

      if (error) {
        Logger.error('Supabase error fetching leaderboard:', { error, timeframe, options });
        throw SupabaseErrorHelper.handleError(error);
      }

      if (!data) {
        return [];
      }

      const typedData = data as unknown as Array<{
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
      }>;

      return typedData.map((entry, index) => ({
        id: entry.user_id,
        userId: entry.user_id,
        displayName: entry.users.privacy_level === 'private' 
          ? 'Anonymous User'
          : entry.users.display_name || 'Anonymous User',
        dailyScore: entry.daily_score,
        weeklyScore: entry.weekly_score,
        rank: start + index + 1,
        photoUrl: entry.users.privacy_level === 'private' ? null : entry.users.photo_url,
        privacyLevel: entry.users.privacy_level,
        streakDays: entry.streak_days,
        isCurrentUser: currentUserId === entry.user_id,
        steps: entry.steps,
        distance: entry.distance,
        calories: entry.calories
      }));
    } catch (error) {
      Logger.error('Error fetching leaderboard:', { error, timeframe, options });
      throw error instanceof Error 
        ? error 
        : new Error('Failed to fetch leaderboard data');
    }
  }

  async subscribeToUpdates(
    timeframe: LeaderboardTimeframe,
    callback: (data: LeaderboardEntry[]) => void
  ): Promise<{ unsubscribe: () => void }> {
    const dateRange = this.getDateRangeForTimeframe(timeframe);
    
    try {
      const channel = supabase.channel('leaderboard_updates')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'health_metrics',
            filter: `date=gte.${dateRange.start},date=lte.${dateRange.end}`
          },
          async () => {
            try {
              const updated = await this.fetchLeaderboard(timeframe, { page: 1 });
              callback(updated);
            } catch (error) {
              Logger.error('Error in leaderboard subscription callback:', { error });
            }
          }
        )
        .subscribe();

      return {
        unsubscribe: () => {
          try {
            channel.unsubscribe();
          } catch (error) {
            Logger.error('Error unsubscribing from leaderboard updates:', { error });
          }
        }
      };
    } catch (error) {
      Logger.error('Error setting up leaderboard subscription:', { error });
      throw error instanceof Error
        ? error
        : new Error('Failed to subscribe to leaderboard updates');
    }
  }

  async verifyTestData(): Promise<boolean> {
    try {
      const data = await this.fetchLeaderboard('daily', { page: 1 });
      return data.length > 0 && data.every(entry => 
        typeof entry.dailyScore === 'number' && 
        typeof entry.rank === 'number'
      );
    } catch (error) {
      Logger.error('Error verifying test data:', { error });
      return false;
    }
  }
}

export const leaderboardService = new LeaderboardService();