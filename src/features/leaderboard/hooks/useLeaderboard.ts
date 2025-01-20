import { useState, useEffect } from 'react';
import { leaderboardService, LeaderboardEntry } from '../services/leaderboardService';

export const useLeaderboard = (initialPage = 1) => {
  const [data, setData] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [page, setPage] = useState(initialPage);

  const fetchData = async () => {
    try {
      setLoading(true);
      const result = await leaderboardService.getLeaderboard(page);
      setData(result);
      setError(null);
    } catch (err) {
      setError(err as Error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let mounted = true;
    
    const loadData = async () => {
      try {
        setLoading(true);
        const result = await leaderboardService.getLeaderboard(page);
        if (mounted) {
          setData(result);
          setError(null);
        }
      } catch (err) {
        if (mounted) {
          setError(err as Error);
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    loadData();

    const subscription = leaderboardService.subscribeToUpdates((newData) => {
      if (mounted) {
        setData(newData);
      }
    });

    return () => {
      mounted = false;
      subscription.then(sub => sub.unsubscribe());
    };
  }, [page]);

  const loadMore = () => {
    setPage(prev => prev + 1);
  };

  return { 
    data, 
    loading, 
    error, 
    page, 
    loadMore,
    refresh: fetchData
  };
}; 