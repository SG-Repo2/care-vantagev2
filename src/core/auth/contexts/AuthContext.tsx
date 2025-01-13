import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { authService } from '../services/AuthService';
import { User, AuthState } from '../types/auth.types';
import { supabase } from '../../../utils/supabase';
import { mapSupabaseUser } from '../types/auth.types';
import { Logger } from '../../../utils/error/Logger';
import { SessionExpiredError, TokenRefreshError } from '../errors/AuthErrors';

interface AuthContextType extends AuthState {
  signInWithEmail: (email: string, password: string) => Promise<void>;
  signUpWithEmail: (email: string, password: string) => Promise<void>;
  signInWithGoogle: (idToken: string) => Promise<void>;
  signOut: () => Promise<void>;
  updateUser: (user: User) => void;
  refreshSession: () => Promise<void>;
  getAccessToken: () => Promise<string>;
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


  const handleAuthError = useCallback((error: any, context: string) => {
    const errorMessage = error instanceof Error ? error.message : 'Authentication error';
    Logger.error(`Auth error in ${context}:`, { error });
    setState(prev => ({
      ...prev,
      error: errorMessage,
      isLoading: false
    }));
    throw error;
  }, []);

  const refreshSession = useCallback(async () => {
    try {
      const { data: { session }, error } = await supabase.auth.refreshSession();
      if (error) throw error;
      if (session?.user) {
        setState(prev => ({
          ...prev,
          user: mapSupabaseUser(session.user),
          error: null
        }));
      }
    } catch (error) {
      handleAuthError(error, 'refreshSession');
    }
  }, [handleAuthError]);

  useEffect(() => {
    const initAuth = async () => {
      try {
        const { data: { user }, error } = await supabase.auth.getUser();
        if (error) throw error;
        setState(prev => ({
          ...prev,
          user: user ? mapSupabaseUser(user) : null,
          isLoading: false
        }));
      } catch (error) {
        handleAuthError(error, 'initAuth');
      }
    };

    initAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (session?.user) {
        try {
          const mappedUser = mapSupabaseUser(session.user);
          setState(prev => ({
            ...prev,
            user: mappedUser,
            error: null
          }));
        } catch (error) {
          handleAuthError(error, 'authStateChange');
        }
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
  }, [handleAuthError]);

  const getAccessToken = useCallback(async () => {
    try {
      return await authService.getAccessToken();
    } catch (error) {
      if (error instanceof SessionExpiredError) {
        await refreshSession();
        return await authService.getAccessToken();
      }
      throw error;
    }
  }, [refreshSession]);

  const value: AuthContextType = {
    ...state,
    signInWithEmail: async (email: string, password: string) => {
      try {
        setState(prev => ({ ...prev, isLoading: true, error: null }));
        const user = await authService.signInWithEmail(email, password);
        setState(prev => ({ ...prev, user, error: null }));
      } catch (error) {
        handleAuthError(error, 'signInWithEmail');
      } finally {
        setState(prev => ({ ...prev, isLoading: false }));
      }
    },
    signUpWithEmail: async (email: string, password: string) => {
      try {
        setState(prev => ({ ...prev, isLoading: true, error: null }));
        const user = await authService.signUpWithEmail(email, password);
        setState(prev => ({ ...prev, user, error: null }));
      } catch (error) {
        handleAuthError(error, 'signUpWithEmail');
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
        handleAuthError(error, 'signInWithGoogle');
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
        handleAuthError(error, 'signOut');
      } finally {
        setState(prev => ({ ...prev, isLoading: false }));
      }
    },
    updateUser: (user: User) => {
      setState(prev => ({ ...prev, user }));
    },
    refreshSession,
    getAccessToken
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
