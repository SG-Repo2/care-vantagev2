import { useCallback, useEffect, useState } from 'react';
import { useHealthData as useHealthDataContext } from '../HealthDataContext';
import type {
  HealthMetrics,
  WeeklyMetrics,
  HealthError,
  HealthProvider
} from '../types';
import { HealthProviderFactory } from '../services/providers/HealthProviderFactory';

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
  const context = useHealthDataContext();
  const [isInitialized, setIsInitialized] = useState(false);
  const [provider, setProvider] = useState<HealthProvider | null>(null);

  const clearError = useCallback(() => {
    context.dispatch({ type: 'CLEAR_ERROR' });
  }, [context]);

  const getWeeklyHistory = useCallback(async (startDate: string, endDate: string): Promise<WeeklyMetrics> => {
    try {
      context.dispatch({ type: 'SET_LOADING', payload: true });

      if (!provider) {
        const newProvider = await HealthProviderFactory.createProvider();
        setProvider(newProvider);
      }

      if (provider?.getWeeklyData) {
        const weeklyData = await provider.getWeeklyData(startDate, endDate);
        context.dispatch({ type: 'SET_WEEKLY_DATA', payload: weeklyData });
        return weeklyData;
      }

      // Fallback if provider doesn't support weekly data
      const weeklyData: WeeklyMetrics = {
        weeklySteps: 0,
        weeklyDistance: 0,
        weeklyCalories: 0,
        weeklyHeartRate: 0,
        startDate,
        endDate,
        score: 0
      };

      context.dispatch({ type: 'SET_WEEKLY_DATA', payload: weeklyData });
      return weeklyData;
    } catch (error) {
      const healthError: HealthError = {
        type: 'data',
        message: error instanceof Error ? error.message : 'Failed to fetch weekly history',
        details: error
      };
      context.dispatch({ type: 'SET_ERROR', payload: healthError });
      throw error;
    } finally {
      context.dispatch({ type: 'SET_LOADING', payload: false });
    }
  }, [context, provider]);

  useEffect(() => {
    const initializeHealthData = async () => {
      try {
        const newProvider = await HealthProviderFactory.createProvider();
        setProvider(newProvider);
        await context.refresh();
        setIsInitialized(true);
      } catch (error) {
        const healthError: HealthError = {
          type: 'initialization',
          message: error instanceof Error ? error.message : 'Failed to initialize health data',
          details: error
        };
        context.dispatch({ type: 'SET_ERROR', payload: healthError });
      }
    };

    if (!isInitialized) {
      initializeHealthData();
    }
  }, [isInitialized, context]);

  return {
    metrics: context.metrics,
    loading: context.loading,
    error: context.error,
    weeklyData: context.weeklyData,
    lastSync: context.lastSync,
    refresh: context.refresh,
    getWeeklyHistory,
    clearError,
    isInitialized
  };
}
