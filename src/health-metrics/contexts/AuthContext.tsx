import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { Session, User, AuthChangeEvent } from '@supabase/supabase-js';
import { supabase } from '../../utils/supabase';
import * as WebBrowser from 'expo-web-browser';
import { Platform } from 'react-native';
import { profileService } from '../../features/profile/services/profileService';
import { HealthProviderFactory } from '../providers/HealthProviderFactory';
import { ErrorHandler } from '../../core/error/ErrorHandler';
import { UserProfileUpdate } from '../../features/profile/types/profile';

type AuthStatus = 'initializing' | 'authenticated' | 'unauthenticated' | 'error';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  status: AuthStatus;
  error: string | null;
  isProfileInitialized: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string) => Promise<void>;
  signInWithGoogle: (idToken: string) => Promise<void>;
  signOut: () => Promise<void>;
  refreshSession: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [status, setStatus] = useState<AuthStatus>('initializing');
  const [error, setError] = useState<string | null>(null);
  const [isProfileInitialized, setIsProfileInitialized] = useState(false);

  const clearState = useCallback(() => {
    setUser(null);
    setSession(null);
    setStatus('unauthenticated');
    setError(null);
    setIsProfileInitialized(false);
  }, []);

  // Initialize auth state
  useEffect(() => {
    let mounted = true;
    const initializeAuth = async () => {
      try {
        const [result, error] = await ErrorHandler.handleAsync(
          supabase.auth.getSession(),
          'AuthProvider.initializeAuth'
        );

        if (!mounted) return;

        if (error || !result) {
          setStatus('error');
          setError(ErrorHandler.getErrorMessage(error || new Error('Failed to get session')));
          return;
        }

        const initialSession = result.data.session;
        setSession(initialSession);
        setUser(initialSession?.user ?? null);

        if (initialSession?.user) {
          setStatus('initializing');
          const [_, initError] = await ErrorHandler.handleAsync(
            initializeUserServices(initialSession.user),
            'AuthProvider.initializeUserServices'
          );

          if (!mounted) return;

          if (initError) {
            setStatus('error');
            setError(ErrorHandler.getErrorMessage(initError));
            return;
          }
        }

        setStatus(initialSession ? 'authenticated' : 'unauthenticated');
        setError(null);
      } catch (err) {
        if (!mounted) return;
        setStatus('error');
        setError(ErrorHandler.getErrorMessage(err));
      }
    };

    // Set up auth state change listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, currentSession) => {
        if (!mounted) return;
        console.log('Auth state changed:', event, currentSession?.user?.id);

        switch (event) {
          case 'SIGNED_IN':
          case 'TOKEN_REFRESHED':
            try {
              setStatus('initializing');
              setSession(currentSession);
              setUser(currentSession?.user ?? null);

              if (currentSession?.user) {
                const [_, initError] = await ErrorHandler.handleAsync(
                  initializeUserServices(currentSession.user),
                  'AuthProvider.initializeUserServices'
                );

                if (!mounted) return;

                if (initError) {
                  setStatus('error');
                  setError(ErrorHandler.getErrorMessage(initError));
                  return;
                }
              }

              setStatus('authenticated');
              setError(null);
            } catch (err) {
              if (!mounted) return;
              setStatus('error');
              setError(ErrorHandler.getErrorMessage(err));
            }
            break;

          case 'SIGNED_OUT':
            await handleSignOut();
            break;
        }
      }
    );

    initializeAuth();

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const initializeUserServices = async (currentUser: User) => {
    try {
      // Initialize or get user profile
      console.log('Initializing user profile...');
      const [profile] = await ErrorHandler.handleAsync(
        profileService.getProfile(currentUser.id),
        'AuthProvider.getProfile'
      );
      
      if (!profile) {
        console.log('Creating new profile for user:', currentUser.id);
        await ErrorHandler.handleAsync(
          profileService.createProfile(currentUser),
          'AuthProvider.createProfile'
        );
      }

      // Initialize health provider
      console.log('Initializing health provider...');
      const [provider] = await ErrorHandler.handleAsync(
        HealthProviderFactory.createProvider(),
        'AuthProvider.createHealthProvider'
      );
      
      // Update profile with permissions status
      if (provider) {
        const timestamp = new Date().toISOString();
        const successUpdate: UserProfileUpdate = {
          permissions_granted: true,
          last_health_sync: timestamp,
          last_error: null,
          updated_at: timestamp
        };
        await profileService.updateProfile(currentUser.id, successUpdate);
        console.log('Health provider initialized and permissions granted');
      }

      setIsProfileInitialized(true);
    } catch (err) {
      console.error('Error initializing user services:', err);
      // Update profile to indicate initialization failure
      const timestamp = new Date().toISOString();
      const errorUpdate: UserProfileUpdate = {
        permissions_granted: false,
        last_health_sync: null,
        last_error: err instanceof Error ? err.message : 'Unknown error during initialization',
        updated_at: timestamp
      };
      await profileService.updateProfile(currentUser.id, errorUpdate)
        .catch(updateErr => {
          console.error('Failed to update profile with error status:', updateErr);
        });
      throw err;
    }
  };

  const handleSignOut = async () => {
    await HealthProviderFactory.cleanup();
    clearState();
  };

  const refreshSession = async () => {
    try {
      setStatus('initializing');
      const [result, error] = await ErrorHandler.handleAsync(
        supabase.auth.getSession(),
        'AuthProvider.refreshSession'
      );

      if (error || !result) {
        throw error || new Error('Failed to get session');
      }

      const currentSession = result.data.session;
      setSession(currentSession);
      setUser(currentSession?.user ?? null);
      setStatus(currentSession ? 'authenticated' : 'unauthenticated');
      setError(null);
    } catch (err) {
      setStatus('error');
      setError(ErrorHandler.getErrorMessage(err));
    }
  };

  const signUp = async (email: string, password: string) => {
    try {
      setStatus('initializing');
      setError(null);

      const [result, error] = await ErrorHandler.handleAsync(
        supabase.auth.signUp({ email, password }),
        'AuthProvider.signUp'
      );

      if (error || !result?.data.user) {
        throw error || new Error('No user returned from sign up');
      }

      // Sign in after successful sign up
      const [signInResult, signInError] = await ErrorHandler.handleAsync(
        supabase.auth.signInWithPassword({ email, password }),
        'AuthProvider.signUpSignIn'
      );

      if (signInError || !signInResult) {
        throw signInError || new Error('Failed to sign in after registration');
      }
    } catch (err) {
      setStatus('error');
      setError(ErrorHandler.getErrorMessage(err));
      throw err;
    }
  };

  const signIn = async (email: string, password: string) => {
    try {
      setStatus('initializing');
      setError(null);
      
      const [result, error] = await ErrorHandler.handleAsync(
        supabase.auth.signInWithPassword({ email, password }),
        'AuthProvider.signIn'
      );

      if (error || !result) {
        throw error || new Error('Failed to sign in');
      }
    } catch (err) {
      setStatus('error');
      setError(ErrorHandler.getErrorMessage(err));
      throw err;
    }
  };

  const signInWithGoogle = async (idToken: string) => {
    try {
      console.log('Starting Google sign in with ID token...');
      setStatus('initializing');
      setError(null);
      
      const [result, error] = await ErrorHandler.handleAsync(
        supabase.auth.signInWithIdToken({
          provider: 'google',
          token: idToken,
        }),
        'AuthProvider.signInWithGoogle'
      );

      if (error || !result?.data.user) {
        throw error || new Error('No user returned from Google sign in');
      }

      // Session will be handled by auth state change listener
    } catch (err) {
      console.error('Detailed Google sign in error:', err);
      setStatus('error');
      setError(ErrorHandler.getErrorMessage(err));
      throw err;
    }
  };

  const signOut = async () => {
    try {
      setStatus('initializing');
      setError(null);
      const [result, error] = await ErrorHandler.handleAsync(
        supabase.auth.signOut(),
        'AuthProvider.signOut'
      );
      
      if (error) {
        throw error;
      }
      
      await handleSignOut();
    } catch (err) {
      setError(ErrorHandler.getErrorMessage(err));
      throw err;
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        status,
        error,
        isProfileInitialized,
        signIn,
        signUp,
        signInWithGoogle,
        signOut,
        refreshSession
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
} 