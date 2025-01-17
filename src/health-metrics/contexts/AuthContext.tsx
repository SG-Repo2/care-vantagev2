import React, { createContext, useContext, useEffect, useState } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { supabase } from '../../utils/supabase';
import * as WebBrowser from 'expo-web-browser';
import { Platform } from 'react-native';
import { profileService } from '../../features/profile/services/profileService';
import { HealthProviderFactory } from '../providers/HealthProviderFactory';

type AuthStatus = 'initializing' | 'authenticated' | 'unauthenticated' | 'error';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  status: AuthStatus;
  error: string | null;
  signIn: (email: string, password: string) => Promise<void>;
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

  // Initialize auth state
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        const { data: { session: initialSession }, error: sessionError } = 
          await supabase.auth.getSession();
        
        if (sessionError) throw sessionError;

        setSession(initialSession);
        setUser(initialSession?.user ?? null);
        setStatus(initialSession ? 'authenticated' : 'unauthenticated');
        setError(null);

        // Set up auth state change listener
        const { data: { subscription } } = supabase.auth.onAuthStateChange(
          async (event, currentSession) => {
            console.log('Auth state changed:', event, currentSession?.user?.id);
            
            if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
              try {
                setStatus('initializing');
                setSession(currentSession);
                setUser(currentSession?.user ?? null);

                if (currentSession?.user) {
                  // Initialize user profile and health provider
                  await initializeUserServices(currentSession.user);
                }

                setStatus('authenticated');
                setError(null);
              } catch (err) {
                console.error('Post-sign-in initialization error:', err);
                setStatus('error');
                setError(err instanceof Error ? err.message : 'Failed to initialize after sign-in');
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
        setStatus('error');
        setError(err instanceof Error ? err.message : 'Failed to initialize auth');
      }
    };

    initializeAuth();
  }, []);

  const initializeUserServices = async (currentUser: User) => {
    try {
      // Initialize or get user profile
      console.log('Initializing user profile...');
      const profile = await profileService.getProfile(currentUser.id);
      if (!profile) {
        console.log('Creating new profile for user:', currentUser.id);
        await profileService.createProfile(currentUser);
      }

      // Initialize health provider
      console.log('Initializing health provider...');
      await HealthProviderFactory.createProvider();
    } catch (err) {
      console.error('Error initializing user services:', err);
      throw err;
    }
  };

  const handleSignOut = async () => {
    setSession(null);
    setUser(null);
    setStatus('unauthenticated');
    setError(null);
    await HealthProviderFactory.cleanup();
  };

  const refreshSession = async () => {
    try {
      setStatus('initializing');
      const { data: { session: currentSession }, error: sessionError } = 
        await supabase.auth.getSession();
      
      if (sessionError) throw sessionError;

      setSession(currentSession);
      setUser(currentSession?.user ?? null);
      setStatus(currentSession ? 'authenticated' : 'unauthenticated');
      setError(null);
    } catch (err) {
      setStatus('error');
      setError(err instanceof Error ? err.message : 'Authentication error');
    }
  };

  const signIn = async (email: string, password: string) => {
    try {
      setStatus('initializing');
      setError(null);
      
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (signInError) throw signInError;
    } catch (err) {
      setStatus('error');
      setError(err instanceof Error ? err.message : 'Sign in failed');
      throw err;
    }
  };

  const signInWithGoogle = async (idToken: string) => {
    try {
      console.log('Starting Google sign in with ID token...');
      setStatus('initializing');
      setError(null);
      
      const { data, error } = await supabase.auth.signInWithIdToken({
        provider: 'google',
        token: idToken,
      });

      console.log('Google sign in response:', { data, error });

      if (error) throw error;
      if (!data.user) {
        throw new Error('No user returned from Supabase');
      }

      // Session will be automatically set by the onAuthStateChange listener
      
    } catch (err) {
      console.error('Detailed Google sign in error:', err);
      setStatus('error');
      setError(err instanceof Error ? err.message : 'Google sign in failed');
      throw err;
    }
  };

  const signOut = async () => {
    try {
      setStatus('initializing');
      setError(null);
      const { error: signOutError } = await supabase.auth.signOut();
      if (signOutError) throw signOutError;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Sign out failed');
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