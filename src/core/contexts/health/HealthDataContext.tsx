import React, { createContext, useContext, useReducer, useCallback, useEffect } from 'react';
import type { 
  HealthDataState, 
  HealthDataAction, 
  HealthDataContextType,
  HealthDataProviderProps,
  HealthError
} from './types';
import { HealthProviderFactory } from './services/providers/HealthProviderFactory';
import { DEFAULT_HEALTH_CONFIG } from './types';
import { useAuth } from '../../auth/contexts/AuthContext';

const initialState: HealthDataState = {
  metrics: null,
  loading: true,
  error: null,
  weeklyData: null,
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
    case 'SET_WEEKLY_DATA':
      return {
        ...state,
        weeklyData: action.payload
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

export function HealthDataProvider({ 
  children, 
  config = DEFAULT_HEALTH_CONFIG,
  validateOnChange = true 
}: HealthDataProviderProps) {
  const [state, dispatch] = useReducer(healthDataReducer, initialState);

  const { user, getAccessToken } = useAuth();

  const requestHealthPermissions = useCallback(async () => {
    try {
      const provider = await HealthProviderFactory.createProvider();
      await provider.requestPermissions();
      return true;
    } catch (error) {
      const healthError: HealthError = {
        type: 'permissions',
        message: error instanceof Error ? error.message : 'Failed to request health permissions',
        details: error
      };
      dispatch({ type: 'SET_ERROR', payload: healthError });
      return false;
    }
  }, []);

  const refresh = useCallback(async () => {
    if (!user) {
      dispatch({ type: 'RESET_STATE' });
      return;
    }

    dispatch({ type: 'SET_LOADING', payload: true });
    try {
      const token = await getAccessToken();
      const provider = await HealthProviderFactory.createProvider();
      
      // Request permissions if needed
      const permissionsGranted = await requestHealthPermissions();
      if (!permissionsGranted) {
        throw new Error('Health permissions not granted');
      }

      const metrics = await provider.getMetrics();
      
      if (validateOnChange) {
        // Validate metrics are within reasonable ranges
        const isValid = metrics.steps >= 0 && 
                       metrics.distance >= 0 && 
                       metrics.calories >= 0 && 
                       metrics.heartRate >= 0;
        
        if (!isValid) {
          throw new Error('Invalid health metrics received');
        }
      }

      dispatch({ type: 'SET_METRICS', payload: metrics });
      dispatch({ type: 'SET_LAST_SYNC', payload: new Date().toISOString() });
    } catch (error) {
      const healthError: HealthError = {
        type: 'data',
        message: error instanceof Error ? error.message : 'Failed to fetch health data',
        details: error
      };
      dispatch({ type: 'SET_ERROR', payload: healthError });
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  }, [user, getAccessToken, validateOnChange, requestHealthPermissions]);

  useEffect(() => {
    // Reset provider when auth state changes
    HealthProviderFactory.resetProvider();
    
    if (user) {
      refresh();

      if (config.enableBackgroundSync) {
        const syncInterval = setInterval(refresh, config.syncInterval || 300000);
        return () => clearInterval(syncInterval);
      }
    }
  }, [user, refresh, config.enableBackgroundSync, config.syncInterval]);

  const clearError = useCallback(() => {
    dispatch({ type: 'CLEAR_ERROR' });
  }, []);

  const contextValue: HealthDataContextType = {
    metrics: state.metrics,
    loading: state.loading,
    error: state.error,
    weeklyData: state.weeklyData || null,
    lastSync: state.lastSync || null,
    dispatch,
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
