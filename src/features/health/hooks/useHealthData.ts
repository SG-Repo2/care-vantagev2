import { useEffect, useState, useCallback, useRef } from 'react';
import { HealthMetrics, WeeklyMetrics } from '../types/health';
import { HealthServiceFactory } from '../services/factory';
import { HealthService } from '../services/types';
import AppleHealthKit from 'react-native-health';
import { getCurrentWeekStart } from '../../../core/constants/metrics';
import healthMetricsService from '../services/healthMetricsService';
import { healthMetricsListener } from '../../../services/realtime/listeners/HealthMetricsListener';
import { HealthMetricType } from '../../../services/database/daos/HealthMetricsDAO';
import { Logger } from '../../../utils/error/Logger';

const { Permissions } = AppleHealthKit.Constants;

const defaultPermissions = {
  permissions: {
    read: [
      Permissions.Steps,
      Permissions.DistanceWalkingRunning,
    ],
    write: [],
  },
};

interface UseHealthDataOptions {
  enableRealtime?: boolean;
  onMetricUpdate?: (metrics: HealthMetrics & WeeklyMetrics) => void;
}

const useHealthData = (profileId: string, options: UseHealthDataOptions = {}) => {
  const [healthService, setHealthService] = useState<HealthService | null>(null);
  const [metrics, setMetrics] = useState<HealthMetrics & WeeklyMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hasPermissions, setHasPermission] = useState(false);
  const subscriptionIds = useRef<string[]>([]);

  const initialize = useCallback(async () => {
    try {
      const service = await HealthServiceFactory.getService();
      setHealthService(service);
      
      const initialized = await service.initialize(defaultPermissions);
      if (initialized) {
        const permissions = await service.hasPermissions();
        setHasPermission(permissions);
        return permissions;
      }
      return false;
    } catch (err) {
      console.error('Health service initialization error:', err);
      setError('Failed to initialize health service');
      return false;
    }
  }, []);

  // Setup realtime subscriptions
  const setupRealtimeSubscriptions = useCallback(async () => {
    if (!options.enableRealtime || !profileId) return;

    try {
      // Subscribe to steps updates
      const stepsSubscriptionId = await healthMetricsListener.subscribeToMetrics(
        profileId,
        HealthMetricType.STEPS,
        async (metric) => {
          // Update metrics when we receive new step data
          setMetrics(current => {
            if (!current) return current;
            const updated = {
              ...current,
              steps: metric.value
            };
            options.onMetricUpdate?.(updated);
            return updated;
          });
        }
      );

      // Subscribe to distance updates
      const distanceSubscriptionId = await healthMetricsListener.subscribeToMetrics(
        profileId,
        HealthMetricType.DISTANCE,
        async (metric) => {
          // Update metrics when we receive new distance data
          setMetrics(current => {
            if (!current) return current;
            const updated = {
              ...current,
              distance: metric.value
            };
            options.onMetricUpdate?.(updated);
            return updated;
          });
        }
      );

      subscriptionIds.current = [stepsSubscriptionId, distanceSubscriptionId];
    } catch (err) {
      Logger.error('Failed to setup realtime subscriptions', { error: err });
    }
  }, [profileId, options.enableRealtime, options.onMetricUpdate]);

  // Cleanup subscriptions
  const cleanupSubscriptions = useCallback(async () => {
    for (const id of subscriptionIds.current) {
      try {
        await healthMetricsListener.unsubscribe(id);
      } catch (err) {
        Logger.error('Failed to unsubscribe from health metrics', { 
          error: err,
          subscriptionId: id 
        });
      }
    }
    subscriptionIds.current = [];
  }, []);

  const fetchHealthData = useCallback(async () => {
    if (!hasPermissions || !healthService) return;

    setLoading(true);
    setError(null);

    try {
      const [metrics, weeklySteps] = await Promise.all([
        healthService.getMetrics(),
        healthService.getWeeklySteps(getCurrentWeekStart())
      ]);

      // Only save metrics to Supabase if we have a valid UUID
      if (profileId && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(profileId)) {
        await healthMetricsService.saveMetrics({
          user_id: profileId,
          date: new Date().toISOString().split('T')[0],
          steps: metrics.steps,
          distance: metrics.distance,
          score: metrics.score
        });
      }

      setMetrics({
        ...metrics,
        profileId,
        weeklySteps,
        weekStartDate: getCurrentWeekStart()
      });
    } catch (err) {
      console.error('Error fetching health data:', err);
      setError('Failed to fetch health data');
    } finally {
      setLoading(false);
    }
  }, [hasPermissions, profileId]);

  const refresh = useCallback(async () => {
    await fetchHealthData();
  }, [fetchHealthData]);

  useEffect(() => {
    const setupHealthData = async () => {
      const initialized = await initialize();
      if (initialized) {
        await fetchHealthData();
        if (options.enableRealtime) {
          await setupRealtimeSubscriptions();
        }
      }
    };

    setupHealthData();

    // Cleanup subscriptions on unmount
    return () => {
      cleanupSubscriptions();
    };
  }, [initialize, fetchHealthData, setupRealtimeSubscriptions, cleanupSubscriptions, options.enableRealtime]);

  return {
    metrics,
    loading,
    error,
    refresh,
    hasPermissions,
    isRealtime: options.enableRealtime && subscriptionIds.current.length > 0,
  };
};

export default useHealthData;
