import { useState, useCallback, useRef } from 'react';
import { Logger } from '../../../utils/error/Logger';
import { authService } from '../services/AuthService';
import { User } from '../types/auth.types';

export interface UseEmailAuthReturn {
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string) => Promise<void>;
  isLoading: boolean;
  error: string | null;
}

export function useEmailAuth(
  onAuthStateChange?: (user: User | null) => void
): UseEmailAuthReturn {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const operationInProgress = useRef(false);

  const handleAuthError = (error: unknown, context: string) => {
    const errorMessage = error instanceof Error ? error.message : 'Authentication error';
    Logger.error(`Auth error in ${context}:`, {
      error,
      context,
      timestamp: new Date().toISOString()
    });
    setError(errorMessage);
  };

  const login = useCallback(async (email: string, password: string) => {
    if (operationInProgress.current) {
      Logger.info('Login operation already in progress');
      return;
    }

    operationInProgress.current = true;
    setIsLoading(true);
    setError(null);

    try {
      const user = await authService.signInWithEmail(email, password);
      
      Logger.info('Email login successful', {
        userId: user?.id,
        timestamp: new Date().toISOString(),
        context: 'emailLogin'
      });

      if (onAuthStateChange) {
        onAuthStateChange(user);
      }
    } catch (error) {
      handleAuthError(error, 'signInWithEmail');
      throw error;
    } finally {
      operationInProgress.current = false;
      setIsLoading(false);
    }
  }, [onAuthStateChange]);

  const register = useCallback(async (email: string, password: string) => {
    if (operationInProgress.current) {
      Logger.info('Registration operation already in progress');
      return;
    }

    operationInProgress.current = true;
    setIsLoading(true);
    setError(null);

    try {
      const user = await authService.signUpWithEmail(email, password);
      
      Logger.info('Email registration successful', {
        userId: user?.id,
        timestamp: new Date().toISOString(),
        context: 'emailRegistration',
        isNewUser: true
      });

      if (onAuthStateChange) {
        onAuthStateChange(user);
      }
    } catch (error) {
      handleAuthError(error, 'signUpWithEmail');
      throw error;
    } finally {
      operationInProgress.current = false;
      setIsLoading(false);
    }
  }, [onAuthStateChange]);

  return {
    login,
    register,
    isLoading,
    error
  };
}