import { useState, useEffect, useCallback } from 'react';
import { HealthMetrics, HealthError } from '../providers/types';
import { HealthProviderFactory } from '../providers/HealthProviderFactory';

interface UseHealthDataResult {
  metrics: HealthMetrics | null;
  loading: boolean;
  error: HealthError | null;
  refresh: () => Promise<void>;
}

const isHealthError = (error: unknown): error is HealthError => {
  return (
    typeof error === 'object' &&
    error !== null &&
    'type' in error &&
    'message' in error
  );
};

export const useHealthData = (date: Date): UseHealthDataResult => {
  const [metrics, setMetrics] = useState<HealthMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<HealthError | null>(null);

  const refresh = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const provider = await HealthProviderFactory.createProvider();
      const hasPermissions = await provider.requestPermissions();
      
      if (!hasPermissions) {
        throw {
          type: 'permissions',
          message: 'Health permissions not granted'
        } as HealthError;
      }

      const data = await provider.getMetrics(date);
      setMetrics(data);
    } catch (err: unknown) {
      const healthError: HealthError = isHealthError(err)
        ? err
        : {
            type: 'data',
            message: err instanceof Error ? err.message : 'Failed to fetch health data',
            details: err
          };
      setError(healthError);
    } finally {
      setLoading(false);
    }
  }, [date]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return {
    metrics,
    loading,
    error,
    refresh
  };
}; 