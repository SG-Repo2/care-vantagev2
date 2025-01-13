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

  const refresh = useCallback(async () => {
    dispatch({ type: 'SET_LOADING', payload: true });
    try {
      const provider = await HealthProviderFactory.createProvider();
      const metrics = await provider.getMetrics();
      
      if (validateOnChange) {
        // TODO: Add validation logic here
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
  }, [validateOnChange]);

  useEffect(() => {
    refresh();

    if (config.enableBackgroundSync) {
      const syncInterval = setInterval(refresh, config.syncInterval || 300000);
      return () => clearInterval(syncInterval);
    }
  }, [refresh, config.enableBackgroundSync, config.syncInterval]);

  const contextValue: HealthDataContextType = {
    state,
    dispatch,
    refresh
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