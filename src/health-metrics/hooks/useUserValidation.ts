import { useEffect, useCallback, useState } from 'react';
import { supabase } from '../../utils/supabase';
import { userValidationService, UserValidationError } from '../services/UserValidationService';
import { UserId } from '../types';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface UseUserValidationResult {
  isValid: boolean;
  isLoading: boolean;
  error: UserValidationError | null;
  validateSession: () => Promise<boolean>;
  clearSession: () => Promise<void>;
}

export const useUserValidation = (): UseUserValidationResult => {
  const [isValid, setIsValid] = useState<boolean>(true);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<UserValidationError | null>(null);

  const clearSession = useCallback(async () => {
    try {
      await AsyncStorage.multiRemove([
        'healthMetrics',
        'userPreferences',
        'syncQueue'
      ]);
      await supabase.auth.signOut();
      userValidationService.clearCache();
    } catch (err) {
      console.error('Error clearing session:', err);
    }
  }, []);

  const validateSession = useCallback(async (): Promise<boolean> => {
    try {
      setIsLoading(true);
      setError(null);

      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        setIsValid(false);
        return false;
      }

      const { isValid: userIsValid, error: validationError } = 
        await userValidationService.validateUser(user.id as UserId);

      if (validationError) {
        setError(validationError);
        setIsValid(false);
        await clearSession();
        return false;
      }

      setIsValid(userIsValid);
      return userIsValid;
    } catch (err) {
      const error = err instanceof UserValidationError 
        ? err 
        : new UserValidationError('Session validation failed', err);
      
      setError(error);
      setIsValid(false);
      await clearSession();
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [clearSession]);

  useEffect(() => {
    validateSession();

    // Subscribe to auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (event === 'SIGNED_OUT') {
          setIsValid(false);
          setError(null);
        } else if (event === 'SIGNED_IN' && session?.user) {
          await validateSession();
        }
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, [validateSession]);

  return {
    isValid,
    isLoading,
    error,
    validateSession,
    clearSession
  };
};