import { useEffect, useState, useCallback } from 'react';
import AppleHealthKit, {
  HealthInputOptions,
  HealthKitPermissions,
  HealthUnit,
  HealthValue,
} from 'react-native-health';
import { Platform, InteractionManager } from 'react-native';
import { HealthMetrics } from '../../profile/types/health';
import { HealthScoring } from '../../../core/utils/scoring';
import { DataSource } from '../../../core/types/base';

const { Permissions } = AppleHealthKit.Constants;

const permissions: HealthKitPermissions = {
  permissions: {
    read: [
      Permissions.Steps,
      Permissions.DistanceWalkingRunning,
    ],
    write: [],
  },
};

const useHealthData = (profileId: string) => {
  const [metrics, setMetrics] = useState<HealthMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hasPermissions, setHasPermission] = useState(false);

  const fetchHealthData = useCallback(async () => {
    if (!hasPermissions || Platform.OS !== 'ios') {
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const options: HealthInputOptions = {
        date: new Date().toISOString(),
      };

      await InteractionManager.runAfterInteractions(async () => {
        const [steps, distance] = await Promise.all([
          new Promise<number>((resolve) =>
            AppleHealthKit.getStepCount(options, (err, results) => {
              if (err) resolve(0);
              else resolve(results.value);
            })
          ),
          new Promise<number>((resolve) =>
            AppleHealthKit.getDistanceWalkingRunning(options, (err, results) => {
              if (err) resolve(0);
              else resolve(results.value / 1000); // Convert meters to kilometers
            })
          ),
        ]);

        const now = new Date();
        const newMetrics: HealthMetrics = {
          id: `metrics_${Date.now()}`,
          profileId,
          date: now.toISOString(),
          steps,
          distance,
          source: 'apple_health' as DataSource,
          createdAt: now,
          updatedAt: now,
        };

        const score = HealthScoring.calculateScore(newMetrics);
        setMetrics({ ...newMetrics, score });
      });
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to fetch health data');
    } finally {
      setLoading(false);
    }
  }, [hasPermissions, profileId]);

  useEffect(() => {
    if (Platform.OS === 'ios') {
      AppleHealthKit.initHealthKit(permissions, (error) => {
        if (error) {
          setError('Failed to get HealthKit permissions');
        } else {
          setHasPermission(true);
        }
      });
    }
  }, []);

  useEffect(() => {
    if (hasPermissions) {
      fetchHealthData();
    }
  }, [fetchHealthData, hasPermissions]);

  return {
    metrics,
    loading,
    error,
    refresh: fetchHealthData,
  };
};

export default useHealthData;
