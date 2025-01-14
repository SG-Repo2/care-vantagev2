import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { GoogleSignin } from '@react-native-google-signin/google-signin';
import { authService } from '../services/AuthService';
import { User, AuthState, AuthContextType } from '../types/auth.types';
import { supabase } from '../../../utils/supabase';
import { mapSupabaseUser } from '../types/auth.types';
import { Logger } from '../../../utils/error/Logger';
import { SessionExpiredError, TokenRefreshError } from '../errors/AuthErrors';
import { StorageService } from '../../../core/storage/StorageService';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ 
  children 
}) => {
  const [state, setState] = useState<AuthState>({
    user: null,
    isLoading: true,
    error: null,
    isAuthenticated: false
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

  const clearAuthData = async () => {
    try {
      // Sign out from Supabase
      await supabase.auth.signOut();
      
      // Clear stored tokens and user data
      await StorageService.clearAll();
      
      // Clear any other auth-related storage
      await AsyncStorage.multiRemove([
        '@health_permissions_granted',
        // Add any other auth-related keys that need to be cleared
      ]);
    } catch (clearError) {
      console.error('Error clearing auth data:', clearError);
    }
  };

  useEffect(() => {
    const handleSessionError = async (error: any) => {
      console.error('Session error:', error);
      
      // Clear stored auth data
      await clearAuthData();
      
      setState(prev => ({
        ...prev,
        user: null,
        isLoading: false,
        error: error instanceof Error ? error.message : 'Session error'
      }));
    };
  
    const handleAuthError = async (error: any) => {
      console.error('Auth error:', error);
      
      // Check for specific JWT sub claim error
      if (error?.message?.includes('User from sub claim in JWT does not exist')) {
        await clearAuthData();
      }
      
      setState(prev => ({
        ...prev,
        user: null,
        isLoading: false,
        error: error instanceof Error ? error.message : 'Authentication error'
      }));
    };
  
    const initAuth = async () => {
      try {
        console.log('Starting auth initialization...');
        
        // First check if we have an existing session
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        
        if (sessionError) {
          // Handle session error specifically
          await handleSessionError(sessionError);
          return;
        }
  
        if (!session) {
          console.log('No existing auth session found');
          setState(prev => ({
            ...prev,
            user: null,
            isLoading: false
          }));
          return;
        }
  
        // If we have a session, get the user
        const { data: { user }, error } = await supabase.auth.getUser();
        console.log('Auth response:', { user, error });
        
        if (error) {
          // Handle user fetch error
          await handleAuthError(error);
          return;
        }
        
        setState(prev => ({
          ...prev,
          user: user ? mapSupabaseUser(user) : null,
          isLoading: false
        }));
      } catch (error) {
        console.error('Auth initialization error:', error);
        await handleAuthError(error);
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
          await handleAuthError(error);
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
    login: async (email: string, password: string) => {
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
    register: async (email: string, password: string) => {
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
    signInWithGoogle: async () => {
      try {
        setState(prev => ({ ...prev, isLoading: true, error: null }));
        await GoogleSignin.signIn();
        const googleUser = await GoogleSignin.getCurrentUser();
        if (!googleUser?.idToken) {
          throw new Error('Failed to get Google ID token');
        }
        const user = await authService.signInWithGoogle(googleUser.idToken);
        setState(prev => ({ ...prev, user, error: null }));
      } catch (error) {
        handleAuthError(error, 'signInWithGoogle');
      } finally {
        setState(prev => ({ ...prev, isLoading: false }));
      }
    },
    logout: async () => {
      try {
        setState(prev => ({ ...prev, isLoading: true, error: null }));
        
        // First set user to null to trigger cleanup in dependent contexts
        setState(prev => ({ ...prev, user: null }));
        
        // Clear all auth-related data using the clearAuthData function
        await clearAuthData();
      } catch (signOutError) {
        console.error('Error during sign out:', signOutError);
        setState(prev => ({
          ...prev,
          error: signOutError instanceof Error ? signOutError.message : 'Sign out failed'
        }));
      } finally {
        setState(prev => ({ ...prev, isLoading: false }));
      }
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
