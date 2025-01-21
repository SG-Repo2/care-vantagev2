import { useState, useEffect, useCallback, useRef } from 'react';
import { enhancedLeaderboardService } from '../services/enhancedLeaderboardService';
import { LeaderboardError } from '../components/LeaderboardErrorBoundary';
import type { 
  LeaderboardEntry, 
  LeaderboardTimeframe,
  LeaderboardState
} from '../types/leaderboard';

export const useLeaderboard = (initialTimeframe: LeaderboardTimeframe = 'daily') => {
  const [state, setState] = useState<LeaderboardState>({
    entries: [],
    timeframe: initialTimeframe,
    loading: true,
    error: null,
    hasMore: true,
    currentPage: 1
  });

  // Use refs to track the latest state in async callbacks
  const stateRef = useRef(state);
  stateRef.current = state;

  // Track mounted state to prevent updates after unmount
  const isMounted = useRef(true);

  const fetchLeaderboard = useCallback(async (page: number, timeframe: LeaderboardTimeframe) => {
    try {
      const newEntries = await enhancedLeaderboardService.fetchLeaderboard(timeframe, { page });
      
      if (isMounted.current) {
        setState(prev => ({
          ...prev,
          entries: page === 1 ? newEntries : [...prev.entries, ...newEntries],
          loading: false,
          error: null,
          hasMore: newEntries.length === 20, // Using default page size
          currentPage: page
        }));
      }
    } catch (err) {
      if (isMounted.current) {
        setState(prev => ({
          ...prev,
          error: err instanceof LeaderboardError 
            ? err 
            : new LeaderboardError(
                'Failed to fetch leaderboard data',
                'FETCH_FAILED'),
          loading: false
        }));
      }
    }
  }, []);

  const refresh = useCallback(async () => {
    if (stateRef.current.loading) return;
    
    setState(prev => ({ ...prev, loading: true, error: null }));
    await fetchLeaderboard(1, stateRef.current.timeframe);
  }, [fetchLeaderboard]);

  const loadMore = useCallback(() => {
    const { loading, hasMore, currentPage, timeframe } = stateRef.current;
    if (!loading && hasMore) {
      setState(prev => ({ ...prev, loading: true }));
      fetchLeaderboard(currentPage + 1, timeframe);
    }
  }, [fetchLeaderboard]);

  const changeTimeframe = useCallback((newTimeframe: LeaderboardTimeframe) => {
    if (stateRef.current.timeframe === newTimeframe) return;
    
    setState(prev => ({
      ...prev,
      timeframe: newTimeframe,
      loading: true,
      currentPage: 1,
      entries: [],
      error: null
    }));
    fetchLeaderboard(1, newTimeframe);
  }, [fetchLeaderboard]);

  useEffect(() => {
    // Initial fetch
    fetchLeaderboard(1, initialTimeframe);

    // Set up subscription
    let subscription: { unsubscribe: () => void } | undefined;
    
    const setupSubscription = async () => {
      try {
        subscription = await enhancedLeaderboardService.subscribeToUpdates(
          initialTimeframe,
          (updatedEntries) => {
            if (isMounted.current && stateRef.current.currentPage === 1) {
              setState(prev => ({
                ...prev,
                entries: updatedEntries,
                loading: false
              }));
            }
          }
        );
      } catch (error) {
        if (isMounted.current) {
          setState(prev => ({
            ...prev,
            error: error instanceof LeaderboardError 
              ? error 
              : new LeaderboardError(
                  'Failed to subscribe to leaderboard updates', 'SUBSCRIPTION_ERROR'),
            loading: false
          }));
        }
      }
    };

    setupSubscription();

    // Cleanup
    return () => {
      isMounted.current = false;
      enhancedLeaderboardService.cleanup();
      if (subscription) {
        subscription.unsubscribe();
      }
    };
  }, [fetchLeaderboard, initialTimeframe]);

  return {
    ...state,
    refresh,
    loadMore,
    changeTimeframe
  };
};