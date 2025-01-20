import { useEffect, useState } from 'react';
import { profileService, UserProfile } from '../services/profileService';

export const useProfile = (userId: string) => {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        setLoading(true);
        const data = await profileService.getProfile(userId);
        setProfile(data);
      } catch (err) {
        setError(err as Error);
      } finally {
        setLoading(false);
      }
    };

    if (userId) fetchProfile();
  }, [userId]);

  const updateProfile = async (updates: Partial<UserProfile>) => {
    try {
      setUpdating(true);
      const updated = await profileService.updateProfile(userId, updates);
      setProfile(updated);
      return updated;
    } catch (err) {
      setError(err as Error);
      throw err;
    } finally {
      setUpdating(false);
    }
  };

  const updateScore = async (newScore: number) => {
    try {
      setUpdating(true);
      await profileService.updateScore(userId, newScore);
      setProfile(prev => prev ? { ...prev, score: newScore } : null);
    } catch (err) {
      setError(err as Error);
      throw err;
    } finally {
      setUpdating(false);
    }
  };

  const uploadProfilePhoto = async (photoUri: string) => {
    try {
      setUpdating(true);
      const publicUrl = await profileService.uploadProfilePhoto(userId, photoUri);
      setProfile(prev => prev ? { ...prev, photo_url: publicUrl } : null);
      return publicUrl;
    } catch (err) {
      setError(err as Error);
      throw err;
    } finally {
      setUpdating(false);
    }
  };

  return {
    profile,
    loading,
    error,
    updating,
    updateProfile,
    updateScore,
    uploadProfilePhoto
  };
};