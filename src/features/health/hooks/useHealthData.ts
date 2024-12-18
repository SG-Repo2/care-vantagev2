import { useEffect, useState, useCallback } from 'react';
import { InteractionManager } from 'react-native';
import { HealthMetrics } from '../../profile/types/health';
import { HealthServiceFactory } from '../services/HealthServiceFactory';

const useHealthData = (profileId: string) => {
  const [metrics, setMetrics] = useState<HealthMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hasPermissions, setHasPermission] = useState(false);

  const healthService = HealthServiceFactory.getService();

  const initialize = useCallback(async () => {
    try {
      const initialized = await healthService.initialize();
      if (!initialized) {
        setError('Failed to initialize health service');
        setLoading(false);
        return;
      }

      const permissions = await healthService.checkPermissions();
      if (!permissions) {
        const granted = await healthService.requestPermissions();
        setHasPermission(granted);
      } else {
        setHasPermission(true);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to initialize health service');
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchHealthData = useCallback(async () => {
    if (!hasPermissions || !healthService.isInitialized()) return;

    setLoading(true);
    setError(null);

    try {
      const date = new Date().toISOString();
      const newMetrics = await healthService.fetchHealthData(date);
      setMetrics(newMetrics);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch health data');
    } finally {
      setLoading(false);
    }
  }, [hasPermissions]);

  useEffect(() => {
    InteractionManager.runAfterInteractions(() => {
      initialize();
    });
  }, [initialize]);

  useEffect(() => {
    if (hasPermissions) {
      fetchHealthData();
    }
  }, [hasPermissions, fetchHealthData]);

  const refresh = useCallback(() => {
    return fetchHealthData();
  }, [fetchHealthData]);

  return {
    metrics,
    loading,
    error,
    hasPermissions,
    refresh,
  };
};

export default useHealthData;
