import React, { createContext, useContext, useReducer, useCallback, useEffect } from 'react';
import type { HealthMetrics, HealthError } from '../providers/types';
import { HealthProviderFactory } from '../providers/HealthProviderFactory';

interface HealthDataState {
  metrics: HealthMetrics | null;
  loading: boolean;
  error: HealthError | null;
  lastSync: string | null;
}

type HealthDataAction =
  | { type: 'SET_METRICS'; payload: HealthMetrics }
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: HealthError }
  | { type: 'CLEAR_ERROR' }
  | { type: 'SET_LAST_SYNC'; payload: string }
  | { type: 'RESET_STATE' };

interface HealthDataContextType extends HealthDataState {
  refresh: () => Promise<void>;
  clearError: () => void;
}

const initialState: HealthDataState = {
  metrics: null,
  loading: true,
  error: null,
  lastSync: null
};

function healthDataReducer(state: HealthDataState, action: HealthDataAction): HealthDataState {
  switch (action.type) {
    case 'SET_METRICS':
      return {
        ...state,
        metrics: action.payload,
        error: null
      };
    case 'SET_LOADING':
      return {
        ...state,
        loading: action.payload
      };
    case 'SET_ERROR':
      return {
        ...state,
        error: action.payload,
        loading: false
      };
    case 'CLEAR_ERROR':
      return {
        ...state,
        error: null
      };
    case 'SET_LAST_SYNC':
      return {
        ...state,
        lastSync: action.payload
      };
    case 'RESET_STATE':
      return initialState;
    default:
      return state;
  }
}

const HealthDataContext = createContext<HealthDataContextType | undefined>(undefined);

interface HealthDataProviderProps {
  children: React.ReactNode;
  config?: {
    enableBackgroundSync?: boolean;
    syncInterval?: number;
  };
}

export function HealthDataProvider({ children, config }: HealthDataProviderProps) {
  const [state, dispatch] = useReducer(healthDataReducer, initialState);

  const refresh = useCallback(async () => {
    console.log('Starting refresh...');
    dispatch({ type: 'SET_LOADING', payload: true });
    
    try {
      console.log('[HealthDataContext] Creating provider...');
      const provider = await HealthProviderFactory.createProvider();
      
      console.log('[HealthDataContext] Requesting permissions...');
      try {
        await provider.requestPermissions();
        console.log('[HealthDataContext] Permissions granted successfully');
      } catch (error) {
        console.error('[HealthDataContext] Permissions not granted');
        throw {
          type: 'permissions',
          message: 'Health permissions not granted. Please grant permissions in your device settings.',
          details: error
        } as HealthError;
      }

      console.log('[HealthDataContext] Getting metrics...');
      const metrics = await provider.getMetrics();
      console.log('[HealthDataContext] Received metrics:', JSON.stringify(metrics, null, 2));
      
      // Ensure we have valid numbers for all metrics
      const validatedMetrics: HealthMetrics = {
        steps: Math.max(0, metrics.steps || 0),
        distance: Math.max(0, metrics.distance || 0),
        calories: Math.max(0, metrics.calories || 0),
        heartRate: Math.max(0, metrics.heartRate || 0),
        lastUpdated: metrics.lastUpdated || new Date().toISOString(),
        score: Math.max(0, metrics.score || 0)
      };

      dispatch({ type: 'SET_METRICS', payload: validatedMetrics });
      dispatch({ type: 'SET_LAST_SYNC', payload: new Date().toISOString() });
    } catch (error) {
      console.error('[HealthDataContext] Health data error:', error);
      const healthError: HealthError = {
        type: 'data',
        message: error instanceof Error ? error.message : 'Failed to fetch health data',
        details: error
      };
      dispatch({ type: 'SET_ERROR', payload: healthError });
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  }, []);

  const clearError = useCallback(() => {
    dispatch({ type: 'CLEAR_ERROR' });
  }, []);

  // Initial data fetch
  useEffect(() => {
    console.log('Initial health data fetch...');
    refresh();

    // Set up background sync if enabled
    if (config?.enableBackgroundSync) {
      const interval = setInterval(refresh, config.syncInterval || 300000);
      return () => clearInterval(interval);
    }
  }, [refresh, config?.enableBackgroundSync, config?.syncInterval]);

  const contextValue: HealthDataContextType = {
    ...state,
    refresh,
    clearError
  };

  return (
    <HealthDataContext.Provider value={contextValue}>
      {children}
    </HealthDataContext.Provider>
  );
}

export function useHealthData(): HealthDataContextType {
  const context = useContext(HealthDataContext);
  if (context === undefined) {
    throw new Error('useHealthData must be used within a HealthDataProvider');
  }
  return context;
}