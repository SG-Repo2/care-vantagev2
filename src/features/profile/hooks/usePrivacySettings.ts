import { useState, useEffect } from 'react';
import { PrivacyLevel } from '../../../core/types/base';
import { profileService } from '../services/profileService';
import { useAuth } from '../../../core/auth/useAuth';

export const usePrivacySettings = () => {
  const { user } = useAuth();
  const [privacyLevel, setPrivacyLevel] = useState<PrivacyLevel>('public');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    let mounted = true;

    const fetchPrivacyLevel = async () => {
      if (!user?.id) {
        setLoading(false);
        return;
      }

      try {
        const level = await profileService.getPrivacyLevel(user.id);
        if (mounted) {
          setPrivacyLevel(level || 'public');
          setError(null);
        }
      } catch (err) {
        if (mounted) {
          setError(err as Error);
          setPrivacyLevel('public');
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    fetchPrivacyLevel();

    return () => {
      mounted = false;
    };
  }, [user?.id]);

  const updatePrivacyLevel = async (newLevel: PrivacyLevel) => {
    if (!user?.id) return;

    try {
      setLoading(true);
      await profileService.updatePrivacy(user.id, newLevel);
      setPrivacyLevel(newLevel);
      setError(null);
    } catch (err) {
      setError(err as Error);
      console.error('Failed to update privacy level:', err);
    } finally {
      setLoading(false);
    }
  };

  return {
    privacyLevel,
    loading,
    error,
    updatePrivacyLevel,
    isPublic: privacyLevel === 'public'
  };
}; 