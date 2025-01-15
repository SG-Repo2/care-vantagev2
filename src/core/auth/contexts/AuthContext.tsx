import React, { createContext, useContext, useCallback } from 'react';
import { User, AuthContextType } from '../types/auth.types';
import { Logger } from '../../../utils/error/Logger';
import { authService } from '../services/AuthService';
import { useAuthState } from '../hooks/useAuthState';
import { useGoogleAuth } from '../hooks/useGoogleAuth';
import { useSessionManagement } from '../hooks/useSessionManagement';
import { useEmailAuth } from '../hooks/useEmailAuth';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children
}) => {
  const {
    user,
    isLoading: authStateLoading,
    error: authStateError,
    isAuthenticated,
    updateUser,
    handleAuthError,
    initializeAuth
  } = useAuthState();

  const {
    signInWithGoogle,
    isLoading: googleAuthLoading,
    error: googleAuthError
  } = useGoogleAuth();

  const {
    refreshSession: refreshSessionHook,
    getAccessToken,
    isRefreshing,
    isGettingToken,
    validateSession
  } = useSessionManagement(
    user?.id,
    updateUser
  );

  const {
    login,
    register,
    isLoading: emailAuthLoading,
    error: emailAuthError
  } = useEmailAuth(updateUser);

  // Initialize auth state and session management
  React.useEffect(() => {
    let mounted = true;

    const initialize = async () => {
      try {
        // First initialize auth state
        const initialUser = await initializeAuth();
        
        if (!mounted) return;

        if (initialUser) {
          // Then validate session if user exists
          await validateSession();
        }
      } catch (error) {
        if (mounted) {
          handleAuthError(error, 'initialization');
        }
      }
    };

    initialize();

    return () => {
      mounted = false;
    };
  }, [initializeAuth, validateSession, handleAuthError]);

  const logout = useCallback(async () => {
    if (authStateLoading || emailAuthLoading || googleAuthLoading) {
      Logger.info('Logout operation already in progress');
      return;
    }

    try {
      await authService.clearAuthData();
      updateUser(null);
    } catch (error) {
      handleAuthError(error, 'logout');
    }
  }, [authStateLoading, emailAuthLoading, googleAuthLoading, updateUser, handleAuthError]);

  // Wrapper function to match AuthContextType interface
  const refreshSession = useCallback(async (): Promise<void> => {
    try {
      await refreshSessionHook();
    } catch (error) {
      handleAuthError(error, 'refreshSession');
    }
  }, [refreshSessionHook, handleAuthError]);

  // Prevent loading state from getting stuck by checking auth state first
  const isLoading = authStateLoading ? true : (
    googleAuthLoading ||
    emailAuthLoading ||
    isRefreshing ||
    isGettingToken
  );

  const error = 
    authStateError || 
    googleAuthError || 
    emailAuthError;

  const value: AuthContextType = {
    user,
    isLoading,
    error,
    isAuthenticated,
    login,
    register,
    signInWithGoogle,
    logout,
    refreshSession,
    getAccessToken,
    updateUser
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
