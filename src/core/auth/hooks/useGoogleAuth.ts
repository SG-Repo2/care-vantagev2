import { useState, useCallback } from 'react';
import { User } from '../types/auth.types';
import { Logger } from '../../../utils/error/Logger';
import { supabase } from '../../../utils/supabase';
import * as AuthSession from 'expo-auth-session';

export interface UseGoogleAuthReturn {
  signInWithGoogle: () => Promise<void>;
  isLoading: boolean;
  error: string | null;
}

export function useGoogleAuth(): UseGoogleAuthReturn {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const signInWithGoogle = useCallback(async () => {
    if (isLoading) {
      Logger.info('Google sign-in operation already in progress');
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      Logger.info('Starting Google sign-in process', {
        timestamp: new Date().toISOString(),
        context: 'googleSignIn'
      });

      const { error: signInError } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: AuthSession.makeRedirectUri({
            path: 'callback'
          }),
          queryParams: {
            access_type: 'offline',
            prompt: 'consent',
          }
        }
      });

      if (signInError) throw signInError;

      Logger.info('Google sign-in initiated successfully', {
        timestamp: new Date().toISOString(),
        context: 'googleSignIn'
      });
    } catch (error) {
      Logger.error('Google sign-in failed', {
        error,
        timestamp: new Date().toISOString(),
        context: 'googleSignIn'
      });
      setError(error instanceof Error ? error.message : 'Failed to initiate Google sign-in');
    } finally {
      setIsLoading(false);
    }
  }, [isLoading]);

  return {
    signInWithGoogle,
    isLoading,
    error
  };
}