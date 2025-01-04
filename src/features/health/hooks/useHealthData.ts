import { useEffect, useState, useCallback, useRef } from 'react';
import { HealthMetrics, WeeklyMetrics } from '../types/health';
import { HealthServiceFactory } from '../services/factory';
import { HealthService } from '../services/types';
import AppleHealthKit from 'react-native-health';
import { getCurrentWeekStart } from '../../../core/constants/metrics';
import healthMetricsService from '../services/healthMetricsService';
import { healthMetricsListener } from '../../../data/repositories/health/HealthMetricsListener';
import { Logger } from '../../../utils/error/Logger';

enum HealthMetricType {
  STEPS = 'steps',
  DISTANCE = 'distance',
}

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
      if (!initialized) {
        throw new Error('Health service failed to initialize');
      }

      const permissions = await service.hasPermissions();
      setHasPermission(permissions);
      
      if (!permissions) {
        Logger.warn('Health permissions not granted');
      }
      
      return permissions;
    } catch (err) {
      Logger.error('Health service initialization error', { error: err });
      setError('Failed to initialize health service');
      throw err; // Re-throw to allow error boundary handling
    }
  }, []);

  // Setup realtime subscriptions
  const setupRealtimeSubscriptions = useCallback(async () => {
    if (!options.enableRealtime || !profileId) {
      Logger.debug('Realtime subscriptions disabled');
      return;
    }

    try {
      const subscriptions = await Promise.allSettled([
        healthMetricsListener.subscribeToMetrics(
          profileId,
          HealthMetricType.STEPS,
          async (metric) => {
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
        ),
        healthMetricsListener.subscribeToMetrics(
          profileId,
          HealthMetricType.DISTANCE,
          async (metric) => {
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
        )
      ]);

      // Filter successful subscriptions
      const successfulSubscriptions = subscriptions
        .filter(result => result.status === 'fulfilled')
        .map(result => (result as PromiseFulfilledResult<string>).value);

      if (successfulSubscriptions.length > 0) {
        subscriptionIds.current = successfulSubscriptions;
        Logger.info('Realtime subscriptions established', {
          count: successfulSubscriptions.length
        });
      } else {
        Logger.warn('No realtime subscriptions could be established');
      }
    } catch (err) {
      Logger.error('Failed to setup realtime subscriptions', {
        error: err,
        profileId
      });
      throw err;
    }
  }, [profileId, options.enableRealtime, options.onMetricUpdate]);

  // Cleanup subscriptions
  const cleanupSubscriptions = useCallback(async () => {
    if (subscriptionIds.current.length === 0) return;

    const results = await Promise.allSettled(
      subscriptionIds.current.map(id =>
        healthMetricsListener.unsubscribe(id)
          .catch(err => {
            Logger.error('Failed to unsubscribe from health metrics', {
              error: err,
              subscriptionId: id
            });
            throw err;
          })
      )
    );

    const successfulUnsubscribes = results.filter(
      result => result.status === 'fulfilled'
    ).length;

    Logger.info('Cleaned up subscriptions', {
      total: subscriptionIds.current.length,
      successful: successfulUnsubscribes
    });

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
