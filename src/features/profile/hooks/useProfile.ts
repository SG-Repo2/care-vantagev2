import { useCallback, useState, useEffect } from 'react';
import { profileService, UserProfile } from '../services/profileService';
import { useAuth } from '../../../health-metrics/contexts/AuthContext';
import { useUserValidation } from '../../../health-metrics/hooks/useUserValidation';
import { UserValidationError } from '../../../health-metrics/services/UserValidationService';

interface UseProfileResult {
  profile: UserProfile | null;
  loading: boolean;
  error: string | null;
  isValid: boolean;
  getProfile: () => Promise<UserProfile | null>;
  updateProfile: (updates: Partial<UserProfile>) => Promise<void>;
  updateAvatar: (uri: string) => Promise<void>;
  refreshProfile: () => Promise<void>;
  updateScore: (metrics: {
    steps: number;
    distance: number;
    calories: number;
    heart_rate?: number;
  }) => Promise<void>;
  deleteAccount: () => Promise<void>;
}

export const useProfile = (): UseProfileResult => {
  const { user, status } = useAuth();
  const { isValid, validateSession, clearSession } = useUserValidation();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);

  const handleError = useCallback((err: unknown) => {
    if (err instanceof UserValidationError) {
      setError(err.message);
      setProfile(null);
      clearSession();
    } else {
      setError(err instanceof Error ? err.message : 'An unknown error occurred');
    }
  }, [clearSession]);

  const refreshProfile = useCallback(async () => {
    if (!user?.id) return;
    
    try {
      setLoading(true);
      setError(null);
      const refreshedProfile = await profileService.getProfile(user.id);
      setProfile(refreshedProfile);
    } catch (err) {
      handleError(err);
    } finally {
      setLoading(false);
    }
  }, [user?.id, handleError]);

  const getProfile = useCallback(async () => {
    if (!user?.id) return null;
    
    try {
      setLoading(true);
      setError(null);
      const profile = await profileService.getProfile(user.id);
      setProfile(profile);
      return profile;
    } catch (err) {
      handleError(err);
      return null;
    } finally {
      setLoading(false);
    }
  }, [user?.id, handleError]);

  const updateProfile = useCallback(async (updates: Partial<UserProfile>) => {
    if (!user?.id) return;

    try {
      setLoading(true);
      setError(null);
      const updatedProfile = await profileService.updateProfile(user.id, updates);
      setProfile(updatedProfile);
    } catch (err) {
      handleError(err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [user?.id, handleError]);

  const updateAvatar = useCallback(async (uri: string) => {
    if (!user?.id) return;

    try {
      setLoading(true);
      setError(null);
      const updatedProfile = await profileService.updateProfilePhoto(user.id, uri);
      setProfile(updatedProfile);
    } catch (err) {
      handleError(err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [user?.id, handleError]);

  const updateScore = useCallback(async (metrics: {
    steps: number;
    distance: number;
    calories: number;
    heart_rate?: number;
  }) => {
    if (!user?.id) return;

    try {
      setError(null);
      const updatedProfile = await profileService.updateScore(user.id, metrics);
      setProfile(updatedProfile);
    } catch (err) {
      handleError(err);
      throw err;
    }
  }, [user?.id, handleError]);

  const deleteAccount = useCallback(async () => {
    if (!user?.id) return;

    try {
      setLoading(true);
      setError(null);
      await profileService.deleteAccount(user.id);
      await clearSession();
      setProfile(null);
    } catch (err) {
      handleError(err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [user?.id, clearSession, handleError]);

  // Initialize profile when user is authenticated
  useEffect(() => {
    if (status === 'authenticated' && user && !profile && isValid) {
      (async () => {
        try {
          setLoading(true);
          let userProfile = await profileService.getProfile(user.id);
          
          if (!userProfile) {
            // Create profile if it doesn't exist
            userProfile = await profileService.createProfile({
              id: user.id,
              email: user.email,
              user_metadata: {
                full_name: user.user_metadata?.full_name,
                avatar_url: user.user_metadata?.avatar_url
              }
            });
          }
          
          setProfile(userProfile);
        } catch (err) {
          handleError(err);
        } finally {
          setLoading(false);
        }
      })();
    } else if (status === 'unauthenticated' || !isValid) {
      setProfile(null);
    }
  }, [user, status, profile, isValid, handleError]);

  return {
    profile,
    loading,
    error,
    isValid,
    getProfile,
    updateProfile,
    updateAvatar,
    refreshProfile,
    updateScore,
    deleteAccount,
  };
};