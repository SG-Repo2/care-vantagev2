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
  });

  // Load persisted auth state
  useEffect(() => {
    const loadUser = async () => {
      try {
        const savedUser = await AsyncStorage.getItem('user');
        if (savedUser) {
          setUser(JSON.parse(savedUser));
        }
      } catch (err) {
        console.error('Error loading auth state:', err);
        setError('Failed to load authentication state');
      } finally {
        setIsLoading(false);
      }
    };

    loadUser();
  }, []);

  // Handle Google Sign-In response
  useEffect(() => {
    if (response?.type === 'success') {
      const { authentication } = response;
      handleSignInWithGoogle(authentication?.accessToken);
    }
  }, [response]);

  // Handle Google Sign-In
  const handleSignInWithGoogle = async (accessToken: string | undefined) => {
    if (!accessToken) {
      setError('Failed to get access token');
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      // Get user info from Google
      const userInfoResponse = await fetch(
        'https://www.googleapis.com/userinfo/v2/me',
        {
          headers: { Authorization: `Bearer ${accessToken}` },
        }
      );

      const userInfo = await userInfoResponse.json();

      if (userInfoResponse.ok) {
        const user: User = {
          id: userInfo.id,
          email: userInfo.email,
          name: userInfo.name,
          photoUrl: userInfo.picture,
        };

        // Persist user data
        await AsyncStorage.setItem('user', JSON.stringify(user));
        setUser(user);
      } else {
        throw new Error('Failed to get user info from Google');
      }
    } catch (err) {
      console.error('Google sign in error:', err);
      setError('Failed to sign in with Google');
    } finally {
      setIsLoading(false);
    }
  };

  const signInWithGoogle = async () => {
    try {
      setError(null);
      await promptAsync();
    } catch (err) {
      console.error('Error initiating Google sign in:', err);
      setError('Failed to initiate Google sign in');
    }
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
