import React, { createContext, useContext, useReducer, useCallback } from 'react';
import { HealthMetrics, HealthError } from '../types';
import { syncQueue } from '../services/HealthMetricsService';

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

  const updateMetrics = useCallback(async (metrics: Partial<HealthMetrics>) => {
    try {
      dispatch({ type: 'UPDATE_METRICS_OPTIMISTIC', payload: metrics });

      if (!navigator.onLine) {
        await syncQueue.add('updateMetrics', { metrics });
        return;
      }

      // Implement actual API call here
      // const response = await healthMetricsService.updateMetrics(metrics);
      dispatch({ type: 'UPDATE_METRICS_SUCCESS', payload: metrics });
    } catch (error) {
      dispatch({ 
        type: 'UPDATE_METRICS_FAILURE', 
        payload: error instanceof Error ? error : new Error('Unknown error') 
      });
    }
  }, []);

  const initializeHealthProviders = useCallback(async () => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      // Implement provider detection and initialization
      // const providers = await detectHealthProviders();
      // for (const provider of providers) {
      //   const data = await healthMetricsService.getProviderData(provider);
      //   dispatch({ type: 'UPDATE_PROVIDER_DATA', payload: { provider, data }});
      // }
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