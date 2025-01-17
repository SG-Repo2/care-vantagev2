import { useState, useEffect, useCallback } from 'react';
import { HealthMetrics, HealthError } from '../providers/types';
import { HealthProviderFactory } from '../providers/HealthProviderFactory';
import { profileService } from '../../features/profile/services/profileService';
import { useAuth } from '../contexts/AuthContext';
import { AppState, AppStateStatus } from 'react-native';

export interface WeeklyMetrics {
  weeklySteps: number;
  weeklyDistance: number;
  weeklyCalories: number;
  weeklyHeartRate: number;
  startDate?: string;
  endDate?: string;
}

interface UseHealthDataResult {
  metrics: HealthMetrics | null;
  loading: boolean;
  error: HealthError | null;
  weeklyData: WeeklyMetrics | null;
  refresh: () => Promise<void>;
  isInitialized: boolean;
}

const SYNC_INTERVAL = 5 * 60 * 1000; // 5 minutes
const BACKGROUND_SYNC_INTERVAL = 15 * 60 * 1000; // 15 minutes

const isHealthError = (error: unknown): error is HealthError => {
  return (
    typeof error === 'object' &&
    error !== null &&
    'type' in error &&
    'message' in error
  );
};

export const useHealthData = (): UseHealthDataResult => {
  const [metrics, setMetrics] = useState<HealthMetrics | null>(null);
  const [weeklyData, setWeeklyData] = useState<WeeklyMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<HealthError | null>(null);
  const [provider, setProvider] = useState<any>(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const [lastSyncTime, setLastSyncTime] = useState<Date | null>(null);
  const { user } = useAuth();

  const syncWithDatabase = useCallback(async (healthMetrics: HealthMetrics) => {
    if (!user?.id) return;

    try {
      const today = new Date().toISOString().split('T')[0];
      await profileService.updateHealthMetrics(user.id, {
        date: today,
        steps: healthMetrics.steps,
        distance: healthMetrics.distance,
        calories: healthMetrics.calories,
        heart_rate: healthMetrics.heartRate
      });
      setLastSyncTime(new Date());
    } catch (err) {
      console.error('Failed to sync with database:', err);
      // Don't throw error to prevent disrupting the UI
    }
  }, [user?.id]);

  const initialize = useCallback(async () => {
    try {
      setLoading(true);
      await HealthProviderFactory.cleanup();
      const newProvider = await HealthProviderFactory.createProvider();
      setProvider(newProvider);
      setIsInitialized(true);
      return newProvider;
    } catch (err) {
      const healthError: HealthError = {
        type: 'availability',
        message: 'Health services not available on this device',
        details: err
      };
      throw healthError;
    } finally {
      setLoading(false);
    }
  }, []);

  const refresh = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      let currentProvider = provider;
      if (!currentProvider) {
        currentProvider = await initialize();
      }

      console.log('Fetching metrics...');
      const data = await currentProvider.getMetrics();
      console.log('Received metrics:', JSON.stringify(data, null, 2));
      
      // Initialize metrics with zeros if no data is available
      const defaultMetrics: HealthMetrics = {
        steps: 0,
        distance: 0,
        calories: 0,
        heartRate: 0,
        lastUpdated: new Date().toISOString(),
        score: 0
      };

      const defaultWeeklyMetrics: WeeklyMetrics = {
        weeklySteps: 0,
        weeklyDistance: 0,
        weeklyCalories: 0,
        weeklyHeartRate: 0,
        startDate: new Date().toISOString(),
        endDate: new Date().toISOString()
      };

      const updatedMetrics = {
        ...defaultMetrics,
        ...data
      };

      setMetrics(updatedMetrics);

      // Set weekly data if available
      if ('weeklySteps' in data) {
        setWeeklyData({
          ...defaultWeeklyMetrics,
          ...data
        });
      }

      // Sync with database if enough time has passed
      const shouldSync = !lastSyncTime || 
        (new Date().getTime() - lastSyncTime.getTime() > SYNC_INTERVAL);
      
      if (shouldSync) {
        await syncWithDatabase(updatedMetrics);
      }
    } catch (err: unknown) {
      console.error('Health data error:', err);
      const healthError: HealthError = isHealthError(err)
        ? err
        : {
            type: 'data',
            message: err instanceof Error ? err.message : 'Failed to fetch health data',
            details: err
          };
      setError(healthError);
      // Don't clear metrics on error, keep showing last known data
    } finally {
      setLoading(false);
    }
  }, [provider, initialize, lastSyncTime, syncWithDatabase]);

  // Handle app state changes for background sync
  useEffect(() => {
    let backgroundSyncInterval: NodeJS.Timeout;

    const handleAppStateChange = async (nextAppState: AppStateStatus) => {
      if (nextAppState === 'active') {
        // App came to foreground, refresh immediately
        await refresh();
        // Start more frequent sync
        backgroundSyncInterval = setInterval(refresh, SYNC_INTERVAL);
      } else if (nextAppState === 'background') {
        // Clear frequent sync interval
        if (backgroundSyncInterval) clearInterval(backgroundSyncInterval);
        // Set up less frequent background sync
        backgroundSyncInterval = setInterval(refresh, BACKGROUND_SYNC_INTERVAL);
      }
    };

    const subscription = AppState.addEventListener('change', handleAppStateChange);

    // Initial setup of sync interval
    backgroundSyncInterval = setInterval(refresh, SYNC_INTERVAL);

    return () => {
      subscription.remove();
      if (backgroundSyncInterval) clearInterval(backgroundSyncInterval);
    };
  }, [refresh]);

  // Initial load
  useEffect(() => {
    refresh();
  }, [refresh]);

  return {
    metrics,
    loading,
    error,
    weeklyData,
    refresh,
    isInitialized
  };
}; 