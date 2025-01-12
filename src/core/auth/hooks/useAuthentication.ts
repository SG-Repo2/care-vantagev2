import { useAuth } from '../contexts/AuthContext';
import { AuthService } from '../services/AuthService';
import { User } from '../types/auth.types';
import { Logger } from '@utils/error/Logger';

export const useAuthentication = () => {
  const auth = useAuth();
  const authService = AuthService.getInstance();

  const isAuthenticated = (): boolean => {
    return authService.isAuthenticated();
  };

  const getAccessToken = async (): Promise<string | null> => {
    try {
      return await authService.getAccessToken();
    } catch (error) {
      Logger.error('Failed to get access token', { error });
      return null;
    }
  };

  const getActiveSessions = async () => {
    try {
      return await authService.getActiveSessions();
    } catch (error) {
      Logger.error('Failed to get active sessions', { error });
      return [];
    }
  };

  const revokeSession = async (deviceId: string): Promise<boolean> => {
    try {
      await authService.revokeSession(deviceId);
      return true;
    } catch (error) {
      Logger.error('Failed to revoke session', { error, deviceId });
      return false;
    }
  };

  const updateUserProfile = async (updates: Partial<User>): Promise<void> => {
    if (!auth.user) {
      throw new Error('No authenticated user');
    }

    const updatedUser: User = {
      ...auth.user,
      ...updates,
      updatedAt: new Date().toISOString()
    };

    auth.updateUser(updatedUser);
  };

  return {
    // Auth state
    user: auth.user,
    isLoading: auth.isLoading,
    error: auth.error,
    
    // Auth methods
    signInWithEmail: auth.signInWithEmail,
    signInWithGoogle: auth.signInWithGoogle,
    signOut: auth.signOut,
    
    // Additional utilities
    isAuthenticated,
    getAccessToken,
    getActiveSessions,
    revokeSession,
    updateUserProfile,
  };
};

// Export types for better DX
export type { User, AuthState } from '../types/auth.types';