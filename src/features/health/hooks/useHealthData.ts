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
import { AndroidHealthService } from '../services/AndroidHealthService';

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

const androidHealthService = new AndroidHealthService();

const useHealthData = (profileId: string) => {
  const [metrics, setMetrics] = useState<HealthMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hasPermissions, setHasPermission] = useState(false);

  const fetchHealthData = useCallback(async () => {
    if (!hasPermissions) return;

    setLoading(true);
    setError(null);

    try {
      let newMetrics: HealthMetrics | null = null;

      if (Platform.OS === 'ios') {
        const options: HealthInputOptions = {
          date: new Date().toISOString(),
        };

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

          newMetrics = {
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
        });
      } else if (Platform.OS === 'android') {
        newMetrics = await androidHealthService.getDailyMetrics(new Date());
      }

      if (newMetrics) {
        const score = HealthScoring.calculateScore(newMetrics);
        newMetrics.score = score;
        setMetrics(newMetrics);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch health data');
    } finally {
      setLoading(false);
    }
  }, [hasPermissions, profileId]);

  useEffect(() => {
    const initializeHealth = async () => {
      if (Platform.OS === 'ios') {
        AppleHealthKit.initHealthKit(permissions, (error: string) => {
          if (error) {
            setError('Failed to initialize HealthKit');
            setHasPermission(false);
          } else {
            setHasPermission(true);
            fetchHealthData();
          }
        });
      } else if (Platform.OS === 'android') {
        const initialized = await androidHealthService.initialize();
        if (initialized) {
          const hasPermission = await androidHealthService.checkPermissions();
          if (hasPermission) {
            setHasPermission(true);
            fetchHealthData();
          } else {
            const granted = await androidHealthService.requestPermissions();
            setHasPermission(granted);
            if (granted) fetchHealthData();
          }
        } else {
          setError('Failed to initialize Health Connect');
        }
      }
    };

    initializeHealth();
  }, [fetchHealthData]);

  const refreshMetrics = useCallback(async () => {
    await fetchHealthData();
  }, [fetchHealthData]);

  return { metrics, loading, error, refreshMetrics };
};

export default useHealthData;
