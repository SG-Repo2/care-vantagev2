import React, { createContext, useContext, useState, useEffect } from 'react';
import { AuthService } from '../services/AuthService';
import { User, AuthState } from '../types/auth.types';
import { supabase } from '@utils/supabase';
import { mapSupabaseUser } from '../types/auth.types';
import { Text } from 'react-native';
import { Logger } from '@utils/error/Logger';

interface AuthContextType extends AuthState {
  signInWithEmail: (email: string, password: string) => Promise<void>;
  signInWithGoogle: (idToken: string) => Promise<void>;
  signOut: () => Promise<void>;
  updateUser: (user: User) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ 
  children 
}) => {
  const [state, setState] = useState<AuthState>({
    user: null,
    isLoading: true,
    error: null
  });

  const authService = AuthService.getInstance();

  useEffect(() => {
    const initAuth = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        setState(prev => ({
          ...prev,
          user: user ? mapSupabaseUser(user) : null,
          isLoading: false
        }));
      } catch (error) {
        Logger.error('Failed to initialize authentication', { error });
        setState(prev => ({
          ...prev,
          error: 'Failed to initialize authentication',
          isLoading: false
        }));
      }
    };

    initAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (session?.user) {
        setState(prev => ({
          ...prev,
          user: mapSupabaseUser(session.user),
          error: null
        }));
      } else {
        setState(prev => ({
          ...prev,
          user: null
        }));
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const value = {
    ...state,
    signInWithEmail: async (email: string, password: string) => {
      try {
        setState(prev => ({ ...prev, isLoading: true, error: null }));
        const user = await authService.signInWithEmail(email, password);
        setState(prev => ({ ...prev, user, error: null }));
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Failed to sign in';
        Logger.error('Sign in with email failed', { error, email });
        setState(prev => ({
          ...prev,
          error: errorMessage
        }));
        throw error;
      } finally {
        setState(prev => ({ ...prev, isLoading: false }));
      }
    },
    signInWithGoogle: async (idToken: string) => {
      try {
        setState(prev => ({ ...prev, isLoading: true, error: null }));
        const user = await authService.signInWithGoogle(idToken);
        setState(prev => ({ ...prev, user, error: null }));
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Failed to sign in with Google';
        Logger.error('Sign in with Google failed', { error });
        setState(prev => ({
          ...prev,
          error: errorMessage
        }));
        throw error;
      } finally {
        setState(prev => ({ ...prev, isLoading: false }));
      }
    },
    signOut: async () => {
      try {
        setState(prev => ({ ...prev, isLoading: true, error: null }));
        await authService.signOut();
        setState(prev => ({ ...prev, user: null }));
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Failed to sign out';
        Logger.error('Sign out failed', { error });
        setState(prev => ({
          ...prev,
          error: errorMessage
        }));
        throw error;
      } finally {
        setState(prev => ({ ...prev, isLoading: false }));
      }
    },
    updateUser: (user: User) => {
      setState(prev => ({ ...prev, user }));
    }
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};