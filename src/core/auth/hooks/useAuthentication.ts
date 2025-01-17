import { useAuth } from '../contexts/AuthContext';
import { User } from '../types/auth.types';
import { Logger } from '@utils/error/Logger';

export const useAuthentication = () => {
  const auth = useAuth();

  const updateUserProfile = async (updates: Partial<User>): Promise<void> => {
    if (!auth.user) {
      throw new Error('No authenticated user');
    }

    const updatedUser: User = {
      ...auth.user,
      ...updates,
      updatedAt: new Date().toISOString()
    };

    // TODO: Implement user profile update in AuthService
    // For now, just update the local state
    auth.updateUser?.(updatedUser);
  };

  return {
    // Auth state
    user: auth.user,
    isLoading: auth.isLoading,
    error: auth.error,
    isAuthenticated: auth.isAuthenticated,
    
    // Auth methods
    login: auth.login,
    register: auth.register,
    signInWithGoogle: auth.signInWithGoogle,
    logout: auth.logout,
    refreshSession: auth.refreshSession,
    getAccessToken: auth.getAccessToken,
    
    // Profile management
    updateUserProfile,
  };
};

// Export types for better DX
export type { User, AuthState } from '../types/auth.types';