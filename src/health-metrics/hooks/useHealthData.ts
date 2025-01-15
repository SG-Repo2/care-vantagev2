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
  const [provider, setProvider] = useState<any>(null);

  const initialize = useCallback(async () => {
    try {
      // Reset provider instance to ensure fresh initialization
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

      const hasPermissions = await currentProvider.requestPermissions();
      if (!hasPermissions) {
        throw {
          type: 'permissions',
          message: 'Health permissions not granted'
        } as HealthError;
      }

      console.log('Fetching metrics for date:', date.toISOString());
      const data = await currentProvider.getMetrics(date);
      console.log('Received metrics:', data);
      
      if (!data) {
        throw {
          type: 'data',
          message: 'No health data available'
        } as HealthError;
      }

      setMetrics(data);
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
      setMetrics(null);
    } finally {
      setLoading(false);
    }
  }, [date, provider, initialize]);

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