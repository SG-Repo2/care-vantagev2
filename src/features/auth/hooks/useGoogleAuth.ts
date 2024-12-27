import { useState, useCallback } from 'react';
import GoogleAuthService from '../services/GoogleAuthService';

export interface GoogleUser {
  id: string;
  email: string;
  displayName: string;
}

export const useGoogleAuth = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const signIn = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const user = await GoogleAuthService.signIn();
      return user;
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to sign in with Google'));
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const signOut = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      await GoogleAuthService.signOut();
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to sign out'));
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const getCurrentUser = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const user = await GoogleAuthService.getCurrentUser();
      return user;
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to get current user'));
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    signIn,
    signOut,
    getCurrentUser,
    loading,
    error,
  };
};
