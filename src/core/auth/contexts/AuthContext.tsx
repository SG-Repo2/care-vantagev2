import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import * as WebBrowser from 'expo-web-browser';
import * as Google from 'expo-auth-session/providers/google';
import Constants from 'expo-constants';
import { User, AuthState, AuthContextType } from '../types/auth.types';
import { Logger } from '../../../utils/error/Logger';
import { SessionExpiredError } from '../errors/AuthErrors';
import { authService } from '../services/AuthService';

// Initialize WebBrowser for auth session
WebBrowser.maybeCompleteAuthSession();

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

  // Initialize Google Auth Request
  const googleAuth = Constants.expoConfig?.extra?.googleAuth;
  
  if (!googleAuth?.webClientId) {
    throw new Error('Missing Google Auth configuration. Check your app.config.js and .env files.');
  }

  const [request, response, promptAsync] = Google.useIdTokenAuthRequest({
    clientId: googleAuth.webClientId,
    iosClientId: googleAuth.iosClientId,
    androidClientId: googleAuth.androidClientId,
    scopes: [
      'https://www.googleapis.com/auth/userinfo.email',
      'https://www.googleapis.com/auth/userinfo.profile',
      'openid'
    ]
  });

  const handleAuthError = useCallback((error: any, context: string) => {
    const errorMessage = error instanceof Error ? error.message : 'Authentication error';
    Logger.error(`Auth error in ${context}:`, { error });
    setState(prev => ({
      ...prev,
      error: errorMessage,
      isLoading: false
    }));
  }, []);

  const refreshSession = useCallback(async () => {
    try {
      const user = await authService.refreshSession();
      setState(prev => ({
        ...prev,
        user,
        error: null,
        isAuthenticated: !!user
      }));
    } catch (error) {
      handleAuthError(error, 'refreshSession');
    }
  }, [handleAuthError]);

  useEffect(() => {
    const initAuth = async () => {
      try {
        Logger.info('Starting auth initialization...');
        const user = await authService.initializeAuth();
        setState(prev => ({
          ...prev,
          user,
          isLoading: false,
          isAuthenticated: !!user
        }));
      } catch (error) {
        Logger.error('Auth initialization error:', { error });
        setState(prev => ({
          ...prev,
          user: null,
          isLoading: false,
          error: error instanceof Error ? error.message : 'Authentication error'
        }));
      }
    };

    initAuth();

    // Subscribe to auth state changes
    const unsubscribe = authService.subscribeToAuthChanges((user) => {
      setState(prev => ({
        ...prev,
        user,
        isAuthenticated: !!user,
        error: null
      }));
    });

    return () => {
      unsubscribe();
    };
  }, []);

  // Handle Google Auth Response
  useEffect(() => {
    if (response?.type === 'success') {
      const { id_token } = response.params;
      handleGoogleSignIn(id_token);
    } else if (response?.type === 'error') {
      handleAuthError(new Error(response.error?.message || 'Failed to authenticate with Google'), 'googleAuth');
    }
  }, [response]);

  const handleGoogleSignIn = async (idToken: string) => {
    try {
      setState(prev => ({ ...prev, isLoading: true, error: null }));
      const user = await authService.signInWithGoogle(idToken);
      setState(prev => ({ 
        ...prev, 
        user, 
        error: null,
        isAuthenticated: true 
      }));
    } catch (error) {
      handleAuthError(error, 'handleGoogleSignIn');
    } finally {
      setState(prev => ({ ...prev, isLoading: false }));
    }
  };

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
    updateUser: (user: User) => {
      setState(prev => ({
        ...prev,
        user,
        isAuthenticated: !!user
      }));
    },
    login: async (email: string, password: string) => {
      try {
        setState(prev => ({ ...prev, isLoading: true, error: null }));
        const user = await authService.signInWithEmail(email, password);
        setState(prev => ({ 
          ...prev, 
          user, 
          error: null,
          isAuthenticated: true 
        }));
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
        setState(prev => ({ 
          ...prev, 
          user, 
          error: null,
          isAuthenticated: true 
        }));
      } catch (error) {
        handleAuthError(error, 'signUpWithEmail');
      } finally {
        setState(prev => ({ ...prev, isLoading: false }));
      }
    },
    signInWithGoogle: async () => {
      try {
        setState(prev => ({ ...prev, isLoading: true, error: null }));
        if (!request) {
          throw new Error('Google Auth request was not initialized');
        }
        await promptAsync();
      } catch (error) {
        handleAuthError(error, 'signInWithGoogle');
        setState(prev => ({ ...prev, isLoading: false }));
      }
    },
    logout: async () => {
      try {
        setState(prev => ({ ...prev, isLoading: true, error: null }));
        await authService.clearAuthData();
        setState(prev => ({ 
          ...prev, 
          user: null,
          isAuthenticated: false 
        }));
      } catch (error) {
        handleAuthError(error, 'logout');
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
