import { useEffect, useState, useCallback } from 'react';
import { HealthMetrics } from '../types/health';
import { HealthServiceFactory } from '../services/factory';
import { HealthService } from '../services/types';
import AppleHealthKit from 'react-native-health';

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

const useHealthData = (profileId: string) => {
  const [healthService, setHealthService] = useState<HealthService | null>(null);
  const [metrics, setMetrics] = useState<HealthMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hasPermissions, setHasPermission] = useState(false);

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

  const fetchHealthData = useCallback(async () => {
    if (!hasPermissions || !healthService) return;

    setLoading(true);
    setError(null);

    try {
      // Wrap HealthKit operations in a background task
      const newMetrics = await new Promise<HealthMetrics>((resolve, reject) => {
        requestAnimationFrame(async () => {
          try {
            const metrics = await healthService.getMetrics();
            resolve(metrics);
          } catch (error) {
            reject(error);
          }
        });
      });

      setMetrics({
        ...newMetrics,
        profileId,
      } as HealthMetrics);
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
      }
    };

    setupHealthData();
  }, [initialize, fetchHealthData]);

  return {
    metrics,
    loading,
    error,
    refresh,
    hasPermissions,
  };
};

export default useHealthData;
