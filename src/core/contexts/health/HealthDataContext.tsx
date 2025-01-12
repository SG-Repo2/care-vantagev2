import React, { createContext, useReducer, useEffect, useCallback } from 'react';
import { HealthDataContextType, HealthDataState, HealthDataAction, HealthDataProviderProps } from './types';
import { HealthDataValidator } from './validators/healthDataValidator';

const initialState: HealthDataState = {
  metrics: {
    steps: 0,
    distance: 0,
    heartRate: 0,
    calories: 0
  },
  weeklyData: null,
  isLoading: false,
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
    case 'SET_WEEKLY_DATA':
      return {
        ...state,
        weeklyData: action.payload,
        error: null
      };
    case 'SET_LOADING':
      return {
        ...state,
        isLoading: action.payload
      };
    case 'SET_ERROR':
      return {
        ...state,
        error: action.payload
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

export const HealthDataContext = createContext<HealthDataContextType | undefined>(undefined);

export const HealthDataProvider: React.FC<HealthDataProviderProps> = ({
  children,
  validateOnChange = true
}) => {
  const [state, dispatch] = useReducer(healthDataReducer, initialState);

  const validateData = useCallback(() => {
    if (!validateOnChange) return;

    // Validate current metrics
    const metricsValidation = HealthDataValidator.validateMetrics(state.metrics);
    if (!metricsValidation.isValid) {
      dispatch({
        type: 'SET_ERROR',
        payload: `Invalid metrics data: ${metricsValidation.errors.join(', ')}`
      });
      return;
    }

    // Validate weekly data if present
    if (state.weeklyData) {
      const weeklyValidation = HealthDataValidator.validateWeeklyData(state.weeklyData);
      if (!weeklyValidation.isValid) {
        dispatch({
          type: 'SET_ERROR',
          payload: `Invalid weekly data: ${weeklyValidation.errors.join(', ')}`
        });
        return;
      }
    }
  }, [state.metrics, state.weeklyData, validateOnChange]);

  useEffect(() => {
    validateData();
  }, [state.metrics, state.weeklyData, validateData]);

  const contextValue: HealthDataContextType = {
    state,
    dispatch
  };

  return (
    <HealthDataContext.Provider value={contextValue}>
      {children}
    </HealthDataContext.Provider>
  );
};

export const useHealthData = (): HealthDataContextType => {
  const context = React.useContext(HealthDataContext);
  if (context === undefined) {
    throw new Error('useHealthData must be used within a HealthDataProvider');
  }
  return context;
};