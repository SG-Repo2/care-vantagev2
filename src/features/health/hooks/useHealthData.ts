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
import { getCurrentPlatform } from '../services/platform';

const { Permissions } = AppleHealthKit.Constants;

const permissions: HealthKitPermissions = {
  permissions: {
    read: [
      Permissions.Steps,
      Permissions.FlightsClimbed,
      Permissions.DistanceWalkingRunning,
      Permissions.HeartRate,
      Permissions.BloodPressureDiastolic,
      Permissions.BloodPressureSystolic,
      Permissions.SleepAnalysis,
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

      // Wrap HealthKit calls in InteractionManager to ensure they run after animations
      await InteractionManager.runAfterInteractions(async () => {
        const [steps, flights, distance] = await Promise.all([
          new Promise<HealthValue>((resolve, reject) => {
            AppleHealthKit.getStepCount(options, (err, results) => {
              if (err) reject(err);
              else resolve(results);
            });
          }),
          new Promise<HealthValue>((resolve, reject) => {
            AppleHealthKit.getFlightsClimbed(options, (err, results) => {
              if (err) reject(err);
              else resolve(results);
            });
          }),
          new Promise<HealthValue>((resolve, reject) => {
            AppleHealthKit.getDistanceWalkingRunning(options, (err, results) => {
              if (err) reject(err);
              else resolve(results);
            });
          }),
        ]);

        const newMetrics: HealthMetrics = {
          id: `metrics_${Date.now()}`,
          profileId,
          date: new Date(),
          steps: steps.value,
          distance: distance.value,
          flights: flights.value,
          source: getCurrentPlatform().type,
          createdAt: new Date(),
          updatedAt: new Date(),
        };

        // Calculate health score
        const score = HealthScoring.calculateScore(newMetrics);
        newMetrics.score = score;

        setMetrics(newMetrics);
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch health data');
    } finally {
      setLoading(false);
    }
  }, [hasPermissions, profileId]);

  useEffect(() => {
    if (Platform.OS !== 'ios') {
      return;
    }

    // Initialize HealthKit after any animations
    InteractionManager.runAfterInteractions(() => {
      AppleHealthKit.initHealthKit(permissions, (err) => {
        if (err) {
          setError('Error getting permissions: ' + err);
          return;
        }
        setHasPermission(true);
      });
    });
  }, []);

  useEffect(() => {
    if (hasPermissions) {
      fetchHealthData();
    }
  }, [hasPermissions, fetchHealthData]);

  return {
    metrics,
    loading,
    error,
    refreshMetrics: fetchHealthData,
  };
};

export default useHealthData;
