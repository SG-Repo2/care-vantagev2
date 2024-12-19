import { useEffect, useState, useCallback } from 'react';
import AppleHealthKit, {
  HealthInputOptions,
  HealthKitPermissions,
  HealthUnit,
} from 'react-native-health';
import { Platform } from 'react-native';
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

  const initializeHealthKit = useCallback(async () => {
    if (Platform.OS !== 'ios') {
      setError('HealthKit is only available on iOS');
      setLoading(false);
      return false;
    }

    return new Promise<boolean>((resolve) => {
      AppleHealthKit.initHealthKit(permissions, (error: string) => {
        if (error) {
          setError('Failed to initialize HealthKit');
          setLoading(false);
          resolve(false);
          return;
        }
        setHasPermission(true);
        resolve(true);
      });
    });
  }, []);

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

      const [steps, distance] = await Promise.all([
        new Promise<number>((resolve, reject) =>
          AppleHealthKit.getStepCount(options, (err, results) => {
            if (err) reject(err);
            else resolve(results.value);
          })
        ),
        new Promise<number>((resolve, reject) =>
          AppleHealthKit.getDistanceWalkingRunning(options, (err, results) => {
            if (err) reject(err);
            else resolve(results.value / 1000); // Convert to kilometers
          })
        ),
      ]);

      const now = new Date();
      const id = `metrics_${now.getTime()}`;
      const score = HealthScoring.calculateScore({ 
        id,
        steps,
        distance,
        profileId: '',  
        date: '',       
        score: 0,
        source: 'apple_health',
        createdAt: now,
        updatedAt: now,
      });
      const newMetrics: HealthMetrics = {
        id,
        profileId,
        date: now.toISOString(),
        steps,
        distance,
        score: score.overall,
        source: 'apple_health',
        createdAt: now,
        updatedAt: now,
      };

      setMetrics(newMetrics);
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
    const initialize = async () => {
      const initialized = await initializeHealthKit();
      if (initialized) {
        await fetchHealthData();
      }
    };

    initialize();
  }, [initializeHealthKit, fetchHealthData]);

  return {
    metrics,
    loading,
    error,
    refresh,
    hasPermissions,
  };
};

export default useHealthData;
