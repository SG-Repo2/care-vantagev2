import React, { createContext, useContext, useCallback, useReducer, useEffect } from 'react';
import { User, AuthContextType, AuthStatus, AuthError } from '../types/auth.types';
import { Logger } from '../../../utils/error/Logger';
import { authService } from '../services/AuthService';
import { useGoogleAuth } from '../hooks/useGoogleAuth';
import { useSessionManagement } from '../hooks/useSessionManagement';
import { useEmailAuth } from '../hooks/useEmailAuth';
import { useAuthState } from '../hooks/useAuthState';

interface AuthStateInternal {
  status: AuthStatus;
  user: User | null;
  error: string | null;
  isLoading: boolean;
}

type AuthAction =
  | { type: 'START_LOADING' }
  | { type: 'INITIALIZE' }
  | { type: 'SET_USER'; payload: User | null }
  | { type: 'SET_ERROR'; payload: string }
  | { type: 'FINISH_LOADING' };

const initialState: AuthStateInternal = {
  status: 'initializing',
  user: null,
  error: null,
  isLoading: true,
};

function authReducer(state: AuthStateInternal, action: AuthAction): AuthStateInternal {
  switch (action.type) {
    case 'START_LOADING':
      return { ...state, isLoading: true };
    case 'INITIALIZE':
      return {
        ...state,
        status: 'unauthenticated',
        isLoading: false,
      };
    case 'SET_USER':
      return {
        ...state,
        status: action.payload ? 'authenticated' : 'unauthenticated',
        user: action.payload,
        isLoading: false,
        error: null, // Clear any previous errors
      };
    case 'SET_ERROR':
      return {
        ...state,
        status: 'error',
        error: action.payload,
        isLoading: false,
      };
    case 'FINISH_LOADING':
      return { ...state, isLoading: false };
    default:
      return state;
  }
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children
}) => {
  const [state, dispatch] = useReducer(authReducer, initialState);
  const { initializeAuth } = useAuthState();

  const updateUser = useCallback((user: User | null) => {
    dispatch({ type: 'SET_USER', payload: user });
  }, []);

  const handleAuthError = useCallback((error: unknown, source: string) => {
    let errorMessage: string;
    
    if (error instanceof Error) {
      errorMessage = error.message;
    } else if (typeof error === 'string') {
      errorMessage = error;
    } else if (error && typeof error === 'object' && 'message' in error) {
      errorMessage = String((error as { message: unknown }).message);
    } else {
      errorMessage = 'An unknown error occurred';
    }

    Logger.error('Auth Error', { source, error: errorMessage });
    dispatch({ type: 'SET_ERROR', payload: errorMessage });
  }, []);

  const {
    signInWithGoogle,
    error: googleAuthError
  } = useGoogleAuth();

  const {
    refreshSession: refreshSessionHook,
    getAccessToken,
    validateSession
  } = useSessionManagement(
    state.user?.id,
    updateUser
  );

  const {
    login,
    register,
    error: emailAuthError
  } = useEmailAuth(updateUser);

  // Initialize auth state with proper cleanup
  useEffect(() => {
    let mounted = true;
    let timeoutId: NodeJS.Timeout;

    const initialize = async () => {
      try {
        dispatch({ type: 'START_LOADING' });
        
        // First initialize auth state
        const initialUser = await initializeAuth();
        
        if (!mounted) return;

        if (initialUser) {
          // Then validate session if user exists
          await validateSession();
          if (mounted) {
            dispatch({ type: 'SET_USER', payload: initialUser });
          }
        } else {
          dispatch({ type: 'INITIALIZE' });
        }
      } catch (error) {
        if (mounted) {
          handleAuthError(error, 'initialization');
        }
      } finally {
        if (mounted) {
          // Ensure loading state is cleared even if there's an error
          timeoutId = setTimeout(() => {
            dispatch({ type: 'FINISH_LOADING' });
          }, 100); // Small delay to prevent UI flicker
        }
      }
    };

    initialize();

    return () => {
      mounted = false;
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [initializeAuth, validateSession, handleAuthError]);

  const logout = useCallback(async () => {
    if (state.isLoading) {
      Logger.info('Auth State', { message: 'Logout operation already in progress' });
      return;
    }

    try {
      dispatch({ type: 'START_LOADING' });
      await authService.clearAuthData();
      dispatch({ type: 'SET_USER', payload: null });
    } catch (error) {
      handleAuthError(error, 'logout');
    }
  }, [state.isLoading, handleAuthError]);

  const refreshSession = useCallback(async (): Promise<void> => {
    try {
      dispatch({ type: 'START_LOADING' });
      await refreshSessionHook();
      dispatch({ type: 'FINISH_LOADING' });
    } catch (error) {
      handleAuthError(error, 'refreshSession');
    }
  }, [refreshSessionHook, handleAuthError]);

  const value: AuthContextType = {
    user: state.user,
    isLoading: state.isLoading,
    error: state.error || googleAuthError || emailAuthError || null,
    isAuthenticated: state.status === 'authenticated',
    status: state.status,
    login,
    register,
    signInWithGoogle,
    logout,
    refreshSession,
    getAccessToken,
    updateUser
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
