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

  const refreshSession = useCallback(async (): Promise<void> => {
    try {
      const user = await authService.refreshSession();
      setState(prev => ({
        ...prev,
        user,
        error: null,
        isAuthenticated: !!user
      }));
    } catch (error) {
      Logger.error('Session refresh failed:', {
        error,
        userId: state.user?.id,
        timestamp: new Date().toISOString()
      });
      setState(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Failed to refresh session',
        isLoading: false
      }));
    }
  }, [state.user?.id]);

  const handleAuthError = useCallback((
    error: unknown,
    context: string,
    additionalInfo?: Record<string, unknown>
  ): void => {
    const errorMessage = error instanceof Error ? error.message : 'Authentication error';
    Logger.error(`Auth error in ${context}:`, {
      error,
      context,
      userId: state.user?.id,
      timestamp: new Date().toISOString(),
      ...additionalInfo
    });
    
    // Handle specific error types
    if (error instanceof SessionExpiredError) {
      Logger.info('Session expired, attempting refresh...');
      refreshSession().catch((refreshError: unknown) => {
        Logger.error('Failed to refresh session:', {
          error: refreshError,
          context: 'refreshSession'
        });
      });
    }
    
    setState(prev => ({
      ...prev,
      error: errorMessage,
      isLoading: false
    }));
  }, [refreshSession, state.user?.id]);

  useEffect(() => {
    const initAuth = async () => {
      try {
        Logger.info('Starting auth initialization...', {
          timestamp: new Date().toISOString(),
          context: 'initialization'
        });
        
        const user = await authService.initializeAuth();
        Logger.info('Auth initialization successful', {
          userId: user?.id,
          timestamp: new Date().toISOString(),
          context: 'initialization'
        });
        
        setState(prev => ({
          ...prev,
          user,
          isLoading: false,
          isAuthenticated: !!user
        }));
      } catch (error) {
        Logger.error('Auth initialization error:', {
          error,
          timestamp: new Date().toISOString(),
          context: 'initialization'
        });
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
      Logger.info('Auth state changed', {
        userId: user?.id,
        isAuthenticated: !!user,
        timestamp: new Date().toISOString(),
        context: 'authStateChange'
      });
      
      setState(prev => ({
        ...prev,
        user,
        isAuthenticated: !!user,
        error: null
      }));
    });

    return () => {
      Logger.info('Cleaning up auth subscriptions', {
        timestamp: new Date().toISOString(),
        context: 'cleanup'
      });
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
    if (!idToken) {
      Logger.error('Invalid Google ID token', {
        context: 'googleSignIn',
        timestamp: new Date().toISOString()
      });
      handleAuthError(new Error('Invalid Google authentication token'), 'googleSignIn');
      return;
    }

    try {
      Logger.info('Starting Google sign-in process', {
        timestamp: new Date().toISOString(),
        context: 'googleSignIn'
      });

      setState(prev => ({ ...prev, isLoading: true, error: null }));
      
      const user = await authService.signInWithGoogle(idToken);
      
      Logger.info('Google sign-in successful', {
        userId: user?.id,
        timestamp: new Date().toISOString(),
        context: 'googleSignIn',
        isNewUser: user?.createdAt === user?.updatedAt
      });

      setState(prev => ({
        ...prev,
        user,
        error: null,
        isAuthenticated: true
      }));
    } catch (error) {
      Logger.error('Google sign-in failed', {
        error,
        timestamp: new Date().toISOString(),
        context: 'googleSignIn'
      });
      handleAuthError(error, 'googleSignIn', {
        idTokenExists: !!idToken
      });
    } finally {
      setState(prev => ({ ...prev, isLoading: false }));
    }
  };

  const getAccessToken = useCallback(async () => {
    try {
      Logger.info('Attempting to get access token', {
        userId: state.user?.id,
        timestamp: new Date().toISOString(),
        context: 'tokenManagement'
      });

      const token = await authService.getAccessToken();
      
      if (!token) {
        throw new Error('No token returned from auth service');
      }

      Logger.info('Successfully retrieved access token', {
        userId: state.user?.id,
        timestamp: new Date().toISOString(),
        context: 'tokenManagement',
        tokenExists: !!token
      });

      return token;
    } catch (error) {
      if (error instanceof SessionExpiredError) {
        Logger.info('Session expired, attempting token refresh', {
          userId: state.user?.id,
          timestamp: new Date().toISOString(),
          context: 'tokenRefresh'
        });

        await refreshSession();
        const newToken = await authService.getAccessToken();

        Logger.info('Successfully refreshed token', {
          userId: state.user?.id,
          timestamp: new Date().toISOString(),
          context: 'tokenRefresh',
          tokenExists: !!newToken
        });

        return newToken;
      }

      Logger.error('Failed to get access token', {
        error,
        userId: state.user?.id,
        timestamp: new Date().toISOString(),
        context: 'tokenManagement'
      });

      throw error;
    }
  }, [refreshSession, state.user?.id]);

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
