import { useCallback, useEffect, useState } from 'react';
import { useHealthData as useHealthContext } from '../HealthDataContext';
import { getHealthService } from '../services/providers/HealthProviderFactory';
import { HealthMetrics, WeeklyMetrics } from '../types';

export function useHealthData() {
  const { state, dispatch } = useHealthContext();
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    let mounted = true;

    const initialize = async () => {
      try {
        dispatch({ type: 'SET_LOADING', payload: true });
        
        const healthService = await getHealthService({
          enableBackgroundSync: true,
          syncInterval: 300000 // 5 minutes
        });

        const hasPermissions = await healthService.hasPermissions();
        if (!hasPermissions) {
          const granted = await healthService.requestPermissions();
          if (!granted) {
            throw new Error('Health data permissions not granted');
          }
        }

        if (mounted) {
          setIsInitialized(true);
          dispatch({ type: 'SET_LOADING', payload: false });
        }
      } catch (error) {
        if (mounted) {
          console.error('Failed to initialize health data:', error);
          dispatch({ 
            type: 'SET_ERROR', 
            payload: error instanceof Error ? error.message : 'Failed to initialize health data'
          });
          dispatch({ type: 'SET_LOADING', payload: false });
        }
      }
    };

    initialize();

    return () => {
      mounted = false;
    };
  }, [dispatch]);

  const refreshMetrics = useCallback(async () => {
    if (!isInitialized) return;

    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      
      const healthService = await getHealthService();
      const metrics = await healthService.getMetrics();
      
      if (metrics) {
        dispatch({ type: 'SET_METRICS', payload: metrics });
        dispatch({ 
          type: 'SET_LAST_SYNC', 
          payload: new Date().toISOString() 
        });
      }
    } catch (error) {
      console.error('Failed to refresh metrics:', error);
      dispatch({ 
        type: 'SET_ERROR', 
        payload: error instanceof Error ? error.message : 'Failed to refresh metrics'
      });
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  }, [isInitialized, dispatch]);

  const fetchWeeklyData = useCallback(async (startDate: string, endDate: string) => {
    if (!isInitialized) return;

    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      
      const healthService = await getHealthService();
      const weeklyData = await healthService.getWeeklyData(startDate, endDate);
      
      if (weeklyData) {
        dispatch({ type: 'SET_WEEKLY_DATA', payload: weeklyData });
      }
    } catch (error) {
      console.error('Failed to fetch weekly data:', error);
      dispatch({ 
        type: 'SET_ERROR', 
        payload: error instanceof Error ? error.message : 'Failed to fetch weekly data'
      });
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  }, [isInitialized, dispatch]);

  const syncData = useCallback(async () => {
    if (!isInitialized) return;

    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      
      const healthService = await getHealthService();
      await healthService.sync();
      
      // Refresh metrics after sync
      await refreshMetrics();
    } catch (error) {
      console.error('Failed to sync health data:', error);
      dispatch({ 
        type: 'SET_ERROR', 
        payload: error instanceof Error ? error.message : 'Failed to sync health data'
      });
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  }, [isInitialized, dispatch, refreshMetrics]);

  return {
    metrics: state.metrics,
    weeklyData: state.weeklyData,
    isLoading: state.isLoading,
    error: state.error,
    lastSync: state.lastSync,
    isInitialized,
    refreshMetrics,
    fetchWeeklyData,
    syncData
  };
}