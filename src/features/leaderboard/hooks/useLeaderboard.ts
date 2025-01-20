import { useEffect, useState } from 'react';
import { leaderboardService, LeaderboardEntry } from '../services/leaderboardService';

export const useLeaderboard = () => {
  const [data, setData] = useState<LeaderboardEntry[]>([]);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchData = async (pageNum: number) => {
    try {
      setLoading(true);
      const results = await leaderboardService.getLeaderboard(pageNum);
      setData(prev => (pageNum === 1 ? results : [...prev, ...results]));
    } catch (err) {
      setError(err as Error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData(page);
    const subscription = leaderboardService.subscribeToUpdates(async (updated) => {
      // Reset to first page when updates occur
      setData(updated);
    });
    return () => {
      subscription.then(sub => sub.unsubscribe());
    };
  }, [page]);

  const loadMore = () => setPage(prev => prev + 1);
  const refresh = () => {
    setPage(1);
    fetchData(1);
  };

  return {
    data,
    loading,
    error,
    loadMore,
    refresh,
    page
  };
};