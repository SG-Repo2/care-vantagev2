import { supabase } from '../../../utils/supabase';
import { Logger } from '../../../utils/error/Logger';
import { monitor } from '../../../utils/error/Monitor';
import { LeaderboardError } from '../components/LeaderboardErrorBoundary';
import { leaderboardService } from './leaderboardService';
import { RequestQueue } from '../utils/RequestQueue';
import type { LeaderboardEntry, LeaderboardOptions, LeaderboardTimeframe } from '../types/leaderboard';

class EnhancedLeaderboardService {
  private requestQueue: RequestQueue;
  private subscriptions: Map<string, { unsubscribe: () => void }>;
  private tokenRefreshPromise: Promise<void> | null = null;
  private static readonly TOKEN_REFRESH_COOLDOWN = 5000; // 5 seconds

  constructor(private baseService = leaderboardService) {
    this.requestQueue = new RequestQueue(2); // Allow 2 concurrent requests
    this.subscriptions = new Map();
  }

  private async refreshToken(): Promise<void> {
    if (this.tokenRefreshPromise) {
      return this.tokenRefreshPromise;
    }

    this.tokenRefreshPromise = (async () => {
      try {
        const { data: { session }, error } = await supabase.auth.refreshSession();
        
        if (error) {
          throw new LeaderboardError('Failed to refresh authentication token', 'AUTH_ERROR');
        }

        if (!session) {
          throw new LeaderboardError('No session after token refresh', 'AUTH_ERROR');
        }

        Logger.info('Successfully refreshed authentication token');
      } catch (error) {
        Logger.error('Token refresh failed:', { error });
        monitor.addAlert({
          severity: 'error',
          component: 'leaderboard',
          message: 'Token refresh failed',
          metadata: { error }
        });
        throw error;
      } finally {
        // Clear the promise after cooldown to prevent too frequent refreshes
        setTimeout(() => {
          this.tokenRefreshPromise = null;
        }, EnhancedLeaderboardService.TOKEN_REFRESH_COOLDOWN);
      }
    })();

    return this.tokenRefreshPromise;
  }

  private async executeWithRetry<T>(
    operation: () => Promise<T>,
    retryCount: number = 0
  ): Promise<T> {
    try {
      return await this.requestQueue.enqueue(operation);
    } catch (error) {
      if (error instanceof Error && error.message.includes('JWT')) {
        if (retryCount === 0) {
          await this.refreshToken();
          return this.executeWithRetry(operation, retryCount + 1);
        }
      }
      throw error;
    }
  }

  async fetchLeaderboard(
    timeframe: LeaderboardTimeframe = 'daily',
    options: LeaderboardOptions = {}
  ): Promise<LeaderboardEntry[]> {
    return this.executeWithRetry(async () => {
      try {
        const result = await this.baseService.fetchLeaderboard(timeframe, options);
        return result;
      } catch (error) {
        if (error instanceof Error) {
          throw new LeaderboardError(
            'Failed to fetch leaderboard data',
            'FETCH_FAILED'
          );
        }
        throw error;
      }
    });
  }

  async subscribeToUpdates(
    timeframe: LeaderboardTimeframe,
    callback: (data: LeaderboardEntry[]) => void
  ): Promise<{ unsubscribe: () => void }> {
    const subscriptionKey = `${timeframe}_${Date.now()}`;

    try {
      const subscription = await this.executeWithRetry(async () => {
        const sub = await this.baseService.subscribeToUpdates(timeframe, async (data) => {
          try {
            // Wrap callback in try-catch to prevent subscription failures
            callback(data);
          } catch (error) {
            Logger.error('Error in leaderboard subscription callback:', { error });
          }
        });
        return sub;
      });

      // Store subscription for cleanup
      this.subscriptions.set(subscriptionKey, subscription);

      return {
        unsubscribe: () => {
          try {
            subscription.unsubscribe();
            this.subscriptions.delete(subscriptionKey);
          } catch (error) {
            Logger.error('Error unsubscribing from leaderboard:', { error });
          }
        }
      };
    } catch (error) {
      Logger.error('Failed to create leaderboard subscription:', { error });
      monitor.addAlert({
        severity: 'error',
        component: 'leaderboard',
        message: 'Failed to create leaderboard subscription',
        metadata: { error, timeframe }
      });
      throw new LeaderboardError(
        'Failed to subscribe to leaderboard updates',
        'SUBSCRIPTION_ERROR'
      );
    }
  }

  // Cleanup method to unsubscribe all subscriptions
  cleanup(): void {
    this.subscriptions.forEach(subscription => {
      try {
        subscription.unsubscribe();
      } catch (error) {
        Logger.error('Error during subscription cleanup:', { error });
      }
    });
    this.subscriptions.clear();
    this.requestQueue.clearQueue();
  }
}

export const enhancedLeaderboardService = new EnhancedLeaderboardService();