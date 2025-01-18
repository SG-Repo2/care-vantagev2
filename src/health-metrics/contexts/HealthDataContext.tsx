import React, { createContext, useContext, useReducer, useCallback, useRef, useEffect } from 'react';
import { HealthMetrics, HealthError, UserId, ProviderMetrics } from '../types';
import { HealthMetricsService } from '../services/HealthMetricsService';
import { useAuth } from '../contexts/AuthContext';
import { FEATURE_FLAGS } from '../config/featureFlags';
import { Logger } from '../../utils/error/Logger';
import { monitor } from '../config/featureFlags';
import { Platform } from 'react-native';

const SYNC_INTERVAL = 5 * 60 * 1000; // 5 minutes
const BACKGROUND_SYNC_INTERVAL = 15 * 60 * 1000; // 15 minutes

const healthMetricsService: HealthMetricsService = {
  getMetrics: async (userId: UserId, date: string) => {
    const response = await fetch(`/api/health-metrics/${userId}?date=${date}`);
    if (!response.ok) throw new Error('Failed to fetch metrics');
    return response.json();
  },
  updateMetrics: async (userId: UserId, metrics: Partial<HealthMetrics>) => {
    const response = await fetch(`/api/health-metrics/${userId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(metrics)
    });
    if (!response.ok) throw new Error('Failed to update metrics');
  },
  validateMetrics: (metrics: Partial<HealthMetrics>) => {
    const errors: Record<string, string[]> = {};
    if (metrics.steps !== undefined && metrics.steps !== null && metrics.steps < 0) {
      errors.steps = ['Steps cannot be negative'];
    }
    if (metrics.distance !== undefined && metrics.distance !== null && metrics.distance < 0) {
      errors.distance = ['Distance cannot be negative'];
    }
    return { isValid: Object.keys(errors).length === 0, errors };
  },
  syncOfflineData: async () => {
    // Implementation handled by syncQueue
  },
  getProviderData: async (source) => {
    const response = await fetch(`/api/health-providers/${source}`);
    if (!response.ok) throw new Error(`Failed to fetch ${source} data`);
    return response.json();
  }
};

interface HealthDataState {
  metrics: HealthMetrics | null;
  isLoading: boolean;
  error: HealthError | null;
  lastSynced: string | null;
}

type HealthDataAction =
  | { type: 'UPDATE_METRICS_OPTIMISTIC'; payload: Partial<HealthMetrics> }
  | { type: 'UPDATE_METRICS_SUCCESS'; payload: Partial<HealthMetrics> }
  | { type: 'UPDATE_METRICS_FAILURE'; payload: Error }
  | { type: 'UPDATE_PROVIDER_DATA'; payload: { provider: string; data: ProviderMetrics } }
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: HealthError | null };

interface HealthDataContextValue extends HealthDataState {
  updateMetrics: (metrics: Partial<HealthMetrics>) => Promise<void>;
  initializeHealthProviders: () => Promise<void>;
}

const initialState: HealthDataState = {
  metrics: null,
  isLoading: false,
  error: null,
  lastSynced: null,
};

const HealthDataContext = createContext<HealthDataContextValue | undefined>(undefined);

const healthDataReducer = (state: HealthDataState, action: HealthDataAction): HealthDataState => {
  switch (action.type) {
    case 'UPDATE_METRICS_OPTIMISTIC':
      return {
        ...state,
        metrics: state.metrics ? { ...state.metrics, ...action.payload } : null,
      };
    case 'UPDATE_METRICS_SUCCESS':
      return {
        ...state,
        metrics: state.metrics ? { ...state.metrics, ...action.payload } : null,
        lastSynced: new Date().toISOString(),
        error: null,
      };
    case 'UPDATE_METRICS_FAILURE':
      return {
        ...state,
        error: {
          type: 'sync',
          message: action.payload.message,
          timestamp: new Date().toISOString(),
        },
      };
    case 'UPDATE_PROVIDER_DATA':
      // Convert provider metrics to our internal format
      const normalizedMetrics: Partial<HealthMetrics> = {
        ...action.payload.data,
        daily_score: action.payload.data.score || 0,
        updated_at: action.payload.data.last_updated || new Date().toISOString(),
      };
      return {
        ...state,
        metrics: state.metrics ? { ...state.metrics, ...normalizedMetrics } : null,
        lastSynced: new Date().toISOString(),
      };
    case 'SET_LOADING':
      return {
        ...state,
        isLoading: action.payload,
      };
    case 'SET_ERROR':
      return {
        ...state,
        error: action.payload,
      };
    default:
      return state;
  }
};

interface HealthDataProviderProps {
  children: React.ReactNode;
  config?: {
    validateOnChange?: boolean;
    syncInterval?: number;
  };
}

export const HealthDataProvider: React.FC<HealthDataProviderProps> = ({
  children,
  config = { validateOnChange: true, syncInterval: SYNC_INTERVAL },
}) => {
  const [state, dispatch] = useReducer(healthDataReducer, initialState);
  const { user } = useAuth();
  const syncIntervalRef = useRef<NodeJS.Timeout>();
  const backgroundSyncIntervalRef = useRef<NodeJS.Timeout>();
  const isMountedRef = useRef(true);

  // Memoize device ID
  const deviceId = useRef<string>(
    Platform.select({
      ios: 'ios',
      android: 'android',
      default: 'web'
    }) + '_' + Math.random().toString(36).substring(7)
  ).current;

  const updateMetrics = useCallback(async (metrics: Partial<HealthMetrics>) => {
    try {
      if (!user) {
        throw new Error('User must be authenticated to update metrics');
      }

      if (!isMountedRef.current) return;

      dispatch({ type: 'UPDATE_METRICS_OPTIMISTIC', payload: metrics });

      // Track performance
      const startTime = performance.now();

      await healthMetricsService.updateMetrics(user.id as UserId, metrics);
      
      monitor.trackPerformance('apiLatency', performance.now() - startTime);
      
      if (!isMountedRef.current) return;
      dispatch({ type: 'UPDATE_METRICS_SUCCESS', payload: metrics });
    } catch (error) {
      Logger.error('Failed to update metrics:', { error, metrics });
      if (!isMountedRef.current) return;
      dispatch({
        type: 'UPDATE_METRICS_FAILURE',
        payload: error instanceof Error ? error : new Error('Unknown error')
      });
    }
  }, [user]);

  const initializeHealthProviders = useCallback(async () => {
    try {
      if (!isMountedRef.current) return;
      dispatch({ type: 'SET_LOADING', payload: true });

      const providers = FEATURE_FLAGS.providerIntegration.providers;
      const startTime = performance.now();

      for (const provider of providers) {
        const data = await healthMetricsService.getProviderData(provider);
        if (!isMountedRef.current) return;
        dispatch({ type: 'UPDATE_PROVIDER_DATA', payload: { provider, data: { ...data, score: data.daily_score } }});
      }

      monitor.trackPerformance('apiLatency', performance.now() - startTime);
    } catch (error) {
      Logger.error('Failed to initialize health providers:', { error });
      if (!isMountedRef.current) return;
      dispatch({ 
        type: 'SET_ERROR', 
        payload: {
          type: 'initialization',
          message: error instanceof Error ? error.message : 'Failed to initialize health providers',
          timestamp: new Date().toISOString(),
        }
      });
    } finally {
      if (!isMountedRef.current) return;
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  }, []);

  // Cleanup function
  useEffect(() => {
    return () => {
      isMountedRef.current = false;
      if (syncIntervalRef.current) {
        clearInterval(syncIntervalRef.current);
      }
      if (backgroundSyncIntervalRef.current) {
        clearInterval(backgroundSyncIntervalRef.current);
      }
    };
  }, []);

  const value: HealthDataContextValue = {
    ...state,
    updateMetrics,
    initializeHealthProviders,
  };

  return (
    <HealthDataContext.Provider value={value}>
      {children}
    </HealthDataContext.Provider>
  );
};

export const useHealthData = (): HealthDataContextValue => {
  const context = useContext(HealthDataContext);
  if (context === undefined) {
    throw new Error('useHealthData must be used within a HealthDataProvider');
  }
  return context;
};