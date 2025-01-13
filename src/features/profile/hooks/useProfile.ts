import { useCallback, useState } from 'react';
import { profileService } from '../services/profileService';
import type { UserProfile } from '../services/profileService';
import { useAuth } from '../../../core/auth/contexts/AuthContext';

export const useProfile = () => {
  const { user, updateUser: setUser } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const getProfile = useCallback(async () => {
    if (!user?.id) return null;
    
    try {
      setLoading(true);
      const profile = await profileService.getProfile(user.id);
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
      setUser(updatedProfile);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update profile');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [user?.id, setUser]);

  const updateAvatar = useCallback(async (uri: string) => {
    if (!user?.id) return;

    try {
      setLoading(true);
      setError(null);
      const updatedProfile = await profileService.updateProfilePhoto(user.id, uri);
      setUser(updatedProfile);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update avatar');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [user?.id, setUser]);

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
    profile: user,
    loading,
    error,
    getProfile,
    updateProfile,
    updateAvatar,
    deleteAccount,
  };
};