import { useState, useEffect, useCallback } from 'react';
import { Logger } from '../../../utils/error/Logger';
import { authService } from '../services/AuthService';
import { User, AuthState } from '../types/auth.types';

export interface UseAuthStateReturn extends AuthState {
  updateUser: (user: User | null) => void;
  handleAuthError: (error: unknown, context: string) => void;
  initializeAuth: () => Promise<User | null>;
}

export function useAuthState(): UseAuthStateReturn {
  const [state, setState] = useState<AuthState>({
    user: null,
    isLoading: true,
    error: null,
    isAuthenticated: false
  });

  const updateUser = useCallback((user: User | null) => {
    setState(prev => ({
      ...prev,
      user,
      isAuthenticated: !!user,
      error: null
    }));
  }, []);

  const handleAuthError = useCallback((error: unknown, context: string) => {
    const errorMessage = error instanceof Error ? error.message : 'Authentication error';
    Logger.error(`Auth error in ${context}:`, {
      error,
      context,
      userId: state.user?.id,
      timestamp: new Date().toISOString()
    });
    
    setState(prev => ({
      ...prev,
      error: errorMessage,
      isLoading: false
    }));
  }, [state.user?.id]);

  const initializeAuth = useCallback(async (): Promise<User | null> => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      Logger.info('Starting auth initialization...', {
        timestamp: new Date().toISOString(),
        context: 'initialization'
      });
      
      const user = await authService.initializeAuth();
      
      Logger.info('Auth initialization successful', {
        userId: user?.id,
        timestamp: new Date().toISOString(),
        context: 'initialization'
      });
      
      setState(prev => ({
        ...prev,
        user,
        isLoading: false,
        isAuthenticated: !!user,
        error: null
      }));

      return user;
    } catch (error) {
      Logger.error('Auth initialization error:', {
        error,
        timestamp: new Date().toISOString(),
        context: 'initialization'
      });
      
      setState(prev => ({
        ...prev,
        user: null,
        isLoading: false,
        isAuthenticated: false,
        error: error instanceof Error ? error.message : 'Authentication error'
      }));

      throw error;
    }
  }, []);

  useEffect(() => {
    let isSubscribed = true;
    let unsubscribe: (() => void) | undefined;

    const setupAuthSubscription = async () => {
      if (!isSubscribed) return;

      try {
        // Initialize auth first
        await initializeAuth();

        // Only subscribe to auth changes after successful initialization
        if (isSubscribed) {
          unsubscribe = authService.subscribeToAuthChanges((updatedUser) => {
            if (!isSubscribed) return;
            
            Logger.info('Auth state changed', {
              userId: updatedUser?.id,
              isAuthenticated: !!updatedUser,
              timestamp: new Date().toISOString(),
              context: 'authStateChange'
            });
            
            setState(prev => ({
              ...prev,
              user: updatedUser,
              isAuthenticated: !!updatedUser,
              isLoading: false,
              error: null
            }));
          });
        }
      } catch (error) {
        if (!isSubscribed) return;
        handleAuthError(error, 'authSubscription');
      }
    };

    setupAuthSubscription();

    return () => {
      isSubscribed = false;
      if (unsubscribe) {
        Logger.info('Cleaning up auth subscriptions', {
          timestamp: new Date().toISOString(),
          context: 'cleanup'
        });
        unsubscribe();
      }
    };
  }, [initializeAuth, handleAuthError]);

  return {
    ...state,
    updateUser,
    handleAuthError,
    initializeAuth
  };
}
