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

export const useHealthData = (): UseHealthDataResult => {
  const [metrics, setMetrics] = useState<HealthMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<HealthError | null>(null);
  const [provider, setProvider] = useState<any>(null);

  const initialize = useCallback(async () => {
    try {
      setLoading(true);
      await HealthProviderFactory.cleanup();
      const newProvider = await HealthProviderFactory.createProvider();
      setProvider(newProvider);
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

      setMetrics({
        ...defaultMetrics,
        ...data // Override defaults with any actual data
      });
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
  }, [provider, initialize]);

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