import React, { createContext, useContext, useReducer, useCallback } from 'react';
import { MD3Theme } from 'react-native-paper';
import { darkTheme } from '../constants/theme';
import { ActionMap } from '../utils/stateManager';
import { createReducer } from '../utils/stateManager';

interface AppState {
  theme: MD3Theme;
  isOnline: boolean;
  lastSync: Date | null;
}

type AppPayload = {
  'SET_THEME': MD3Theme;
  'SET_ONLINE_STATUS': boolean;
  'UPDATE_SYNC_TIME': Date;
  'RESET_STATE': undefined;
};

type AppActions = ActionMap<AppPayload>[keyof ActionMap<AppPayload>];

const initialState: AppState = {
  theme: darkTheme,
  isOnline: true,
  lastSync: null,
};

const appReducer = createReducer<AppState, AppActions>({
  SET_THEME: (state, action) => ({
    ...state,
    theme: action.payload,
  }),
  SET_ONLINE_STATUS: (state, action) => ({
    ...state,
    isOnline: action.payload,
  }),
  UPDATE_SYNC_TIME: (state, action) => ({
    ...state,
    lastSync: action.payload,
  }),
  RESET_STATE: () => initialState,
});

interface AppContextValue {
  state: AppState;
  setTheme: (theme: MD3Theme) => void;
  setOnlineStatus: (status: boolean) => void;
  updateSyncTime: (time: Date) => void;
  resetState: () => void;
}

const AppContext = createContext<AppContextValue | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ 
  children 
}) => {
  const [state, dispatch] = useReducer(appReducer, initialState);

  const setTheme = useCallback((theme: MD3Theme) => {
    dispatch({ type: 'SET_THEME', payload: theme });
  }, []);

  const setOnlineStatus = useCallback((status: boolean) => {
    dispatch({ type: 'SET_ONLINE_STATUS', payload: status });
  }, []);

  const updateSyncTime = useCallback((time: Date) => {
    dispatch({ type: 'UPDATE_SYNC_TIME', payload: time });
  }, []);

  const resetState = useCallback(() => {
    dispatch({ type: 'RESET_STATE' });
  }, []);

  const value = {
    state,
    setTheme,
    setOnlineStatus,
    updateSyncTime,
    resetState,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};