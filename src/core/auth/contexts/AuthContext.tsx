import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { GoogleSignin } from '@react-native-google-signin/google-signin';
import { authService } from '../services/AuthService';
import { User, AuthState, AuthContextType } from '../types/auth.types';
import { Logger } from '../../../utils/error/Logger';
import { SessionExpiredError } from '../errors/AuthErrors';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ 
  children 
}) => {
  const [state, setState] = useState<AuthState>({
    user: null,
    isLoading: true,
    error: null,
    isAuthenticated: false
  });

  const handleAuthError = useCallback((error: any, context: string) => {
    const errorMessage = error instanceof Error ? error.message : 'Authentication error';
    Logger.error(`Auth error in ${context}:`, { error });
    setState(prev => ({
      ...prev,
      error: errorMessage,
      isLoading: false
    }));
  }, []);

  const refreshSession = useCallback(async () => {
    try {
      const user = await authService.refreshSession();
      setState(prev => ({
        ...prev,
        user,
        error: null,
        isAuthenticated: !!user
      }));
    } catch (error) {
      handleAuthError(error, 'refreshSession');
    }
  }, [handleAuthError]);

  useEffect(() => {
    const initAuth = async () => {
      try {
        Logger.info('Starting auth initialization...');
        const user = await authService.initializeAuth();
        setState(prev => ({
          ...prev,
          user,
          isLoading: false,
          isAuthenticated: !!user
        }));
      } catch (error) {
        Logger.error('Auth initialization error:', { error });
        setState(prev => ({
          ...prev,
          user: null,
          isLoading: false,
          error: error instanceof Error ? error.message : 'Authentication error'
        }));
      }
    };

    initAuth();

    // Subscribe to auth state changes
    const unsubscribe = authService.subscribeToAuthChanges((user) => {
      setState(prev => ({
        ...prev,
        user,
        isAuthenticated: !!user,
        error: null
      }));
    });

    return () => {
      unsubscribe();
    };
  }, []);

  const getAccessToken = useCallback(async () => {
    try {
      return await authService.getAccessToken();
    } catch (error) {
      if (error instanceof SessionExpiredError) {
        await refreshSession();
        return await authService.getAccessToken();
      }
      throw error;
    }
  }, [refreshSession]);

  const value: AuthContextType = {
    ...state,
    updateUser: (user: User) => {
      setState(prev => ({
        ...prev,
        user,
        isAuthenticated: !!user
      }));
    },
    login: async (email: string, password: string) => {
      try {
        setState(prev => ({ ...prev, isLoading: true, error: null }));
        const user = await authService.signInWithEmail(email, password);
        setState(prev => ({ 
          ...prev, 
          user, 
          error: null,
          isAuthenticated: true 
        }));
      } catch (error) {
        handleAuthError(error, 'signInWithEmail');
      } finally {
        setState(prev => ({ ...prev, isLoading: false }));
      }
    },
    register: async (email: string, password: string) => {
      try {
        setState(prev => ({ ...prev, isLoading: true, error: null }));
        const user = await authService.signUpWithEmail(email, password);
        setState(prev => ({ 
          ...prev, 
          user, 
          error: null,
          isAuthenticated: true 
        }));
      } catch (error) {
        handleAuthError(error, 'signUpWithEmail');
      } finally {
        setState(prev => ({ ...prev, isLoading: false }));
      }
    },
    signInWithGoogle: async () => {
      try {
        setState(prev => ({ ...prev, isLoading: true, error: null }));
        await GoogleSignin.signIn();
        const googleUser = await GoogleSignin.getCurrentUser();
        if (!googleUser?.idToken) {
          throw new Error('Failed to get Google ID token');
        }
        const user = await authService.signInWithGoogle(googleUser.idToken);
        setState(prev => ({ 
          ...prev, 
          user, 
          error: null,
          isAuthenticated: true 
        }));
      } catch (error) {
        handleAuthError(error, 'signInWithGoogle');
      } finally {
        setState(prev => ({ ...prev, isLoading: false }));
      }
    },
    logout: async () => {
      try {
        setState(prev => ({ ...prev, isLoading: true, error: null }));
        await authService.clearAuthData();
        setState(prev => ({ 
          ...prev, 
          user: null,
          isAuthenticated: false 
        }));
      } catch (error) {
        handleAuthError(error, 'logout');
      } finally {
        setState(prev => ({ ...prev, isLoading: false }));
      }
    },
    refreshSession,
    getAccessToken
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
