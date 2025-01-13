import { useCallback, useEffect, useState } from 'react';
import { useHealthData as useHealthDataContext } from '../HealthDataContext';
import type {
  HealthMetrics,
  WeeklyMetrics,
  HealthError
} from '../types';

interface UseHealthDataReturn {
  metrics: (HealthMetrics & WeeklyMetrics) | null;
  loading: boolean;
  error: HealthError | null;
  weeklyData: WeeklyMetrics | null;
  lastSync: string | null;
  refresh: () => Promise<void>;
  getWeeklyHistory: (startDate: string, endDate: string) => Promise<WeeklyMetrics>;
  clearError: () => void;
  isInitialized: boolean;
}

export function useHealthData(): UseHealthDataReturn {
  const { state, dispatch, refresh } = useHealthDataContext();
  const [isInitialized, setIsInitialized] = useState(false);

  const clearError = useCallback(() => {
    dispatch({ type: 'CLEAR_ERROR' });
  }, [dispatch]);

  const getWeeklyHistory = useCallback(async (startDate: string, endDate: string): Promise<WeeklyMetrics> => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });

      // TODO: Implement actual weekly history fetching logic
      const weeklyData: WeeklyMetrics = {
        weeklySteps: 0,
        weeklyDistance: 0,
        weeklyCalories: 0,
        weeklyHeartRate: 0,
        startDate,
        endDate,
        score: 0
      };

      dispatch({ type: 'SET_WEEKLY_DATA', payload: weeklyData });
      return weeklyData;
    } catch (error) {
      const healthError: HealthError = {
        type: 'data',
        message: error instanceof Error ? error.message : 'Failed to fetch weekly history',
        details: error
      };
      dispatch({ type: 'SET_ERROR', payload: healthError });
      throw error;
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  }, [dispatch]);

  useEffect(() => {
    const initializeHealthData = async () => {
      try {
        await refresh();
        setIsInitialized(true);
      } catch (error) {
        const healthError: HealthError = {
          type: 'initialization',
          message: error instanceof Error ? error.message : 'Failed to initialize health data',
          details: error
        };
        dispatch({ type: 'SET_ERROR', payload: healthError });
      }
    };

    if (!isInitialized) {
      initializeHealthData();
    }
  }, [isInitialized, refresh, dispatch]);

  return {
    metrics: state.metrics,
    loading: state.loading,
    error: state.error,
    weeklyData: state.weeklyData,
    lastSync: state.lastSync,
    refresh,
    getWeeklyHistory,
    clearError,
    isInitialized
  };
}
