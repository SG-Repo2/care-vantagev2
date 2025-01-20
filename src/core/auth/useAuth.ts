import { useEffect, useState, useCallback } from 'react';
import { User } from '@supabase/supabase-js';
import { supabase } from '../../utils/supabase';
import { profileService } from '../../features/profile/services/profileService';

export const useAuth = () => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [profileInitialized, setProfileInitialized] = useState(false);

  const clearState = useCallback(() => {
    setUser(null);
    setProfileInitialized(false);
    setError(null);
    setLoading(false);
  }, []);

  const ensureUserProfile = useCallback(async (currentUser: User) => {
    try {
      // First validate the session
      await profileService.validateSession();
      
      // Then check/create profile
      const profile = await profileService.getProfile(currentUser.id);
      
      if (!profile) {
        console.log('Creating new profile for user:', currentUser.id);
        // Create profile if it doesn't exist
        await profileService.createProfile(
          currentUser.id,
          currentUser.email || ''
        );
      }
      
      setProfileInitialized(true);
    } catch (err) {
      console.error('Failed to ensure user profile:', err);
      // If session is invalid, sign out
      if (err instanceof Error && err.message.includes('No valid session')) {
        await signOut();
      } else {
        setError(err instanceof Error ? err : new Error('Failed to initialize user profile'));
      }
    }
  }, []);

  const signOut = useCallback(async () => {
    try {
      setLoading(true);
      await profileService.signOut();
      clearState();
    } catch (err) {
      console.error('Sign out error:', err);
      setError(err instanceof Error ? err : new Error('Failed to sign out'));
    } finally {
      setLoading(false);
    }
  }, [clearState]);

  useEffect(() => {
    let mounted = true;

    // Get initial session
    const initializeAuth = async () => {
      try {
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        
        if (!mounted) return;

        if (sessionError) {
          setError(sessionError);
          clearState();
        } else if (session?.user) {
          setUser(session.user);
          await ensureUserProfile(session.user);
        } else {
          clearState();
        }
      } catch (err) {
        if (!mounted) return;
        console.error('Auth initialization error:', err);
        clearState();
      }
    };

    initializeAuth();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!mounted) return;

      console.log('Auth state changed:', event, session?.user?.id);
      
      if (event === 'SIGNED_OUT') {
        clearState();
      } else if (session?.user) {
        setUser(session.user);
        await ensureUserProfile(session.user);
      } else {
        clearState();
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [ensureUserProfile, clearState]);

  return {
    user,
    loading,
    error,
    isAuthenticated: !!user,
    profileInitialized,
    signOut
  };
}; 