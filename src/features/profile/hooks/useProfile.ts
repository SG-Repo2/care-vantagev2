import { useCallback, useState, useEffect } from 'react';
import { profileService, UserProfile } from '../services/profileService';
import { useAuth } from '../../../health-metrics/contexts/AuthContext';

interface UseProfileResult {
  profile: UserProfile | null;
  loading: boolean;
  error: string | null;
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
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);

  // Initialize profile when user is authenticated
  useEffect(() => {
    if (status === 'authenticated' && user && !profile) {
      (async () => {
        try {
          setLoading(true);
          let userProfile = await profileService.getProfile(user.id);
          
          if (!userProfile) {
            // Create profile if it doesn't exist
            userProfile = await profileService.createProfile(user);
          }
          
          setProfile(userProfile);
        } catch (err) {
          setError(err instanceof Error ? err.message : 'Failed to initialize profile');
        } finally {
          setLoading(false);
        }
      })();
    } else if (status === 'unauthenticated') {
      setProfile(null);
    }
  }, [user, status, profile]);

  const refreshProfile = useCallback(async () => {
    if (!user?.id) return;
    
    try {
      setLoading(true);
      const refreshedProfile = await profileService.getProfile(user.id);
      setProfile(refreshedProfile);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to refresh profile');
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  const getProfile = useCallback(async () => {
    if (!user?.id) return null;
    
    try {
      setLoading(true);
      const profile = await profileService.getProfile(user.id);
      setProfile(profile);
      return profile;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load profile');
      return null;
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  const updateProfile = useCallback(async (updates: Partial<UserProfile>) => {
    if (!user?.id) return;

    try {
      setLoading(true);
      setError(null);
      const updatedProfile = await profileService.updateProfile(user.id, updates);
      setProfile(updatedProfile);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update profile');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  const updateAvatar = useCallback(async (uri: string) => {
    if (!user?.id) return;

    try {
      setLoading(true);
      setError(null);
      const updatedProfile = await profileService.updateProfilePhoto(user.id, uri);
      setProfile(updatedProfile);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update avatar');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

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
      setError(err instanceof Error ? err.message : 'Failed to update score');
      throw err;
    }
  }, [user?.id]);

  const deleteAccount = useCallback(async () => {
    if (!user?.id) return;

    try {
      setLoading(true);
      setError(null);
      // TODO: Implement account deletion
      throw new Error('Account deletion not implemented');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete account');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  return {
    profile,
    loading,
    error,
    getProfile,
    updateProfile,
    updateAvatar,
    refreshProfile,
    updateScore,
    deleteAccount,
  };
};