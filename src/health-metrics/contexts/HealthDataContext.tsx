import React, { createContext, useContext, useReducer, useCallback } from 'react';
import { HealthMetrics, HealthError, UserId } from '../types';
import { HealthMetricsService } from '../services/HealthMetricsService';
import { useAuth } from '../contexts/AuthContext';
import { FEATURE_FLAGS } from '../config/featureFlags';
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
    if (metrics.steps !== undefined && metrics.steps < 0) {
      errors.steps = ['Steps cannot be negative'];
    }
    if (metrics.distance !== undefined && metrics.distance < 0) {
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
  | { type: 'UPDATE_PROVIDER_DATA'; payload: { provider: string; data: HealthMetrics } }
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
      return {
        ...state,
        metrics: action.payload.data,
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
  config = { validateOnChange: true, syncInterval: 5000 },
}) => {
  const [state, dispatch] = useReducer(healthDataReducer, initialState);
  const { user } = useAuth();

  const updateMetrics = useCallback(async (metrics: Partial<HealthMetrics>) => {
    try {
      if (!user) {
        throw new Error('User must be authenticated to update metrics');
      }

      dispatch({ type: 'UPDATE_METRICS_OPTIMISTIC', payload: metrics });

      // Store metrics locally for offline support
      if (typeof window !== 'undefined' && !window.navigator?.onLine) {
        // Queue for later sync when online
        return;
      }

      await healthMetricsService.updateMetrics(user.id as UserId, metrics);
      dispatch({ type: 'UPDATE_METRICS_SUCCESS', payload: metrics });
    } catch (error) {
      dispatch({
        type: 'UPDATE_METRICS_FAILURE',
        payload: error instanceof Error ? error : new Error('Unknown error')
      });
    }
  }, [user]);

  const initializeHealthProviders = useCallback(async () => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      const providers = FEATURE_FLAGS.providerIntegration.providers;
      for (const provider of providers) {
        const data = await healthMetricsService.getProviderData(provider);
        dispatch({ type: 'UPDATE_PROVIDER_DATA', payload: { provider, data }});
      }
    } catch (error) {
      dispatch({ 
        type: 'SET_ERROR', 
        payload: {
          type: 'initialization',
          message: error instanceof Error ? error.message : 'Failed to initialize health providers',
          timestamp: new Date().toISOString(),
        }
      });
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
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