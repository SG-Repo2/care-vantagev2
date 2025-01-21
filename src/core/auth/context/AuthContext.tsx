import React, { createContext, useContext, useEffect, useState } from 'react';
import { Platform } from 'react-native';
import * as WebBrowser from 'expo-web-browser';
import { supabase } from '../../../utils/supabase';
import { profileService } from '../../../features/profile/services/profileService';
import { HealthProviderFactory } from '../../../features/health/providers/HealthProviderFactory';

// Import centralized types and error handling
import { AuthContextType, AuthProviderProps } from '../types/context';
import { AuthStatus, User, Session } from '../types/domain';
import { AUTH_STATUS } from '../constants/auth.constants';
import { transformAuthError } from '../errors/AuthErrors';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [status, setStatus] = useState<AuthStatus>(AUTH_STATUS.INITIALIZING);
  const [error, setError] = useState<string | null>(null);

  // Initialize auth state
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        const { data: { session: initialSession }, error: sessionError } =
          await supabase.auth.getSession();
        
        if (sessionError) {
          const authError = transformAuthError(sessionError);
          throw authError;
        }

        setSession(initialSession);
        setUser(initialSession?.user ?? null);
        setStatus(initialSession ? AUTH_STATUS.AUTHENTICATED : AUTH_STATUS.UNAUTHENTICATED);
        setError(null);

        // Set up auth state change listener
        const { data: { subscription } } = supabase.auth.onAuthStateChange(
          async (event, currentSession) => {
            console.log('Auth state changed:', event, currentSession?.user?.id);
            
            if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
              try {
                setStatus(AUTH_STATUS.INITIALIZING);
                setSession(currentSession);
                setUser(currentSession?.user ?? null);

                if (currentSession?.user) {
                  // Initialize user profile and health provider
                  await initializeUserServices(currentSession.user);
                }

                setStatus(AUTH_STATUS.AUTHENTICATED);
                setError(null);
              } catch (err) {
                console.error('Post-sign-in initialization error:', err);
                const authError = transformAuthError(err);
                setStatus(AUTH_STATUS.ERROR);
                setError(authError.message);
              }
            } else if (event === 'SIGNED_OUT') {
              await handleSignOut();
            }
          }
        );

        return () => {
          subscription.unsubscribe();
        };
      } catch (err) {
        console.error('Auth initialization error:', err);
        const authError = transformAuthError(err);
        setStatus(AUTH_STATUS.ERROR);
        setError(authError.message);
      }
    };

    initializeAuth();
  }, []);

  const initializeUserServices = async (currentUser: User) => {
    try {
      // Initialize or get user profile
      console.log('Initializing user profile...');
      let profile = await profileService.getProfile(currentUser.id);
      
      if (!profile) {
        console.log('Creating new profile for user:', currentUser.id);
        profile = await profileService.createProfile(currentUser);
      }

      // Validate profile exists before proceeding
      if (!profile) {
        throw new Error('Failed to create or retrieve user profile');
      }

      // Initialize health provider
      console.log('Initializing health provider...');
      const provider = await HealthProviderFactory.createProvider();
      
      // Update profile with permissions status
      if (provider) {
        await profileService.updateProfile(currentUser.id, {
          permissions_granted: true,
          last_health_sync: new Date().toISOString()
        });
        console.log('Health provider initialized and permissions granted');
      }
    } catch (err) {
      console.error('Error initializing user services:', err);
      const authError = transformAuthError(err);
      // Update profile to indicate initialization failure
      await profileService.updateProfile(currentUser.id, {
        permissions_granted: false,
        last_error: authError.message
      }).catch(updateErr => {
        console.error('Failed to update profile with error status:', updateErr);
      });
      throw authError;
    }
  };

  const handleSignOut = async () => {
    setSession(null);
    setUser(null);
    setStatus(AUTH_STATUS.UNAUTHENTICATED);
    setError(null);
    await HealthProviderFactory.cleanup();
  };

  const refreshSession = async () => {
    try {
      setStatus(AUTH_STATUS.INITIALIZING);
      const { data: { session: currentSession }, error: sessionError } = 
        await supabase.auth.getSession();
      
      if (sessionError) {
        const authError = transformAuthError(sessionError);
        throw authError;
      }

      setSession(currentSession);
      setUser(currentSession?.user ?? null);
      setStatus(currentSession ? AUTH_STATUS.AUTHENTICATED : AUTH_STATUS.UNAUTHENTICATED);
      setError(null);
    } catch (err) {
      const authError = transformAuthError(err);
      setStatus(AUTH_STATUS.ERROR);
      setError(authError.message);
      throw authError;
    }
  };

  const signIn = async (email: string, password: string) => {
    try {
      setStatus(AUTH_STATUS.INITIALIZING);
      setError(null);
      
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (signInError) {
        const authError = transformAuthError(signInError);
        throw authError;
      }
    } catch (err) {
      const authError = transformAuthError(err);
      setStatus(AUTH_STATUS.ERROR);
      setError(authError.message);
      throw authError;
    }
  };

  const signInWithGoogle = async (idToken: string) => {
    try {
      console.log('Starting Google sign in with ID token...');
      setStatus(AUTH_STATUS.INITIALIZING);
      setError(null);
      
      const { data, error } = await supabase.auth.signInWithIdToken({
        provider: 'google',
        token: idToken,
      });

      console.log('Google sign in response:', { data, error });

      if (error) {
        const authError = transformAuthError(error);
        throw authError;
      }
      if (!data.user) {
        const authError = transformAuthError(new Error('No user returned from Supabase'));
        throw authError;
      }

      // Session will be automatically set by the onAuthStateChange listener
      
    } catch (err) {
      console.error('Detailed Google sign in error:', err);
      const authError = transformAuthError(err);
      setStatus(AUTH_STATUS.ERROR);
      setError(authError.message);
      throw authError;
    }
  };

  const signOut = async () => {
    try {
      setStatus(AUTH_STATUS.INITIALIZING);
      setError(null);
      const { error: signOutError } = await supabase.auth.signOut();
      if (signOutError) {
        const authError = transformAuthError(signOutError);
        throw authError;
      }
    } catch (err) {
      const authError = transformAuthError(err);
      setStatus(AUTH_STATUS.ERROR);
      setError(authError.message);
      throw authError;
    }
  };

  return (
    <AuthContext.Provider 
      value={{ 
        user, 
        session, 
        status, 
        error, 
        signIn,
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