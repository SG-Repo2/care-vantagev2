import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Google from 'expo-auth-session/providers/google';
import * as WebBrowser from 'expo-web-browser';
import { Platform } from 'react-native';
import Constants from 'expo-constants';

WebBrowser.maybeCompleteAuthSession();

// Types
interface User {
  id: string;
  email: string;
  name?: string;
  photoUrl?: string;
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  error: string | null;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
}

interface AuthProviderProps {
  children: ReactNode;
}

// Context
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Provider
export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Google OAuth configuration
  const [request, response, promptAsync] = Google.useAuthRequest({
    androidClientId: Constants.expoConfig?.extra?.googleAuth?.androidClientId,
    iosClientId: Constants.expoConfig?.extra?.googleAuth?.iosClientId,
    webClientId: Constants.expoConfig?.extra?.googleAuth?.webClientId,
    clientId: Constants.expoConfig?.extra?.googleAuth?.expoClientId,
    scopes: ['openid', 'profile', 'email'],
  });

  // For development: Set mock user immediately
  useEffect(() => {
    const mockUser: User = {
      id: 'mock-user-id',
      email: 'mock@example.com',
      name: 'Mock User',
      photoUrl: 'https://via.placeholder.com/150',
    };
    setUser(mockUser);
    setIsLoading(false);
  }, []);

  // Mock sign in function for development
  const signInWithGoogle = async () => {
    const mockUser: User = {
      id: 'mock-user-id',
      email: 'mock@example.com',
      name: 'Mock User',
      photoUrl: 'https://via.placeholder.com/150',
    };
    setUser(mockUser);
  };

  const signOut = async () => {
    try {
      setError(null);
      await AsyncStorage.removeItem('user');
      setUser(null);
    } catch (err) {
      console.error('Error signing out:', err);
      setError('Failed to sign out');
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        error,
        signInWithGoogle,
        signOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

// Hook
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
