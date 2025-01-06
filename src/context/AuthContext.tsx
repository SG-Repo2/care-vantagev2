import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Text } from 'react-native';
import { supabase } from '../utils/supabase';
import * as Google from 'expo-auth-session/providers/google';
import * as WebBrowser from 'expo-web-browser';
import * as AuthSession from 'expo-auth-session';
import { Platform } from 'react-native';
import { User, mapSupabaseUser } from '../features/auth/types/auth';
import Constants from 'expo-constants';
import { profileService } from '../features/profile/services/profileService';

WebBrowser.maybeCompleteAuthSession();

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  error: string | null;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
  updateUser: (user: User) => void;
}

interface AuthProviderProps {
  children: ReactNode;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const googleAuth = Constants.expoConfig?.extra?.googleAuth;
  
  if (!googleAuth?.iosClientId || !googleAuth?.webClientId || !googleAuth?.androidClientId) {
    throw new Error('Missing Google Auth configuration. Check your app.config.js and .env files.');
  }

  const [request, response, promptAsync] = Google.useIdTokenAuthRequest({
    clientId: Platform.select({
      ios: googleAuth.iosClientId,
      android: googleAuth.androidClientId,
      default: googleAuth.webClientId,
    }),
    iosClientId: googleAuth.iosClientId,
    androidClientId: googleAuth.androidClientId,
    webClientId: googleAuth.webClientId,
    scopes: [
      'https://www.googleapis.com/auth/userinfo.email',
      'https://www.googleapis.com/auth/userinfo.profile',
      'openid'
    ]
  });

  useEffect(() => {
    const initAuth = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        setUser(user ? mapSupabaseUser(user) : null);
      } catch (err) {
        console.error('Error initializing auth:', err);
        setError('Failed to initialize authentication');
      } finally {
        setIsLoading(false);
      }
    };

    initAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (session?.user) {
        setUser(mapSupabaseUser(session.user));
      } else {
        setUser(null);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (response?.type === 'success') {
      const { id_token } = response.params;
      handleGoogleSignIn(id_token);
    } else if (response?.type === 'error') {
      console.error('Google Auth Error:', response.error);
      setError(response.error?.message || 'Failed to authenticate with Google');
    }
  }, [response]);

  const handleGoogleSignIn = async (idToken: string) => {
    try {
      setError(null);
      setIsLoading(true);
      
      const { data, error } = await supabase.auth.signInWithIdToken({
        provider: 'google',
        token: idToken,
      });

      if (error) {
        console.error('Supabase auth error:', error);
        throw error;
      }
      
      if (data.user) {
        const mappedUser = mapSupabaseUser(data.user);
        
        // Check if profile exists
        const existingProfile = await profileService.getProfile(data.user.id);
        
        if (!existingProfile) {
          // Profile doesn't exist, create a new one
          try {
            await profileService.createProfile(mappedUser);
          } catch (profileError) {
            console.error('Failed to create user profile:', profileError);
            // Even if profile creation fails, we still want to set the user
            // They can try updating their profile later
          }
        }
        
        setUser(mappedUser);
      }
    } catch (err) {
      console.error('Error signing in with Google:', err);
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('Failed to sign in with Google');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const signInWithGoogle = async () => {
    try {
      setError(null);
      if (!request) {
        throw new Error('Google Auth request was not initialized');
      }
      await promptAsync();
    } catch (err) {
      console.error('Error initiating Google sign-in:', err);
      setError('Failed to initiate Google sign-in');
    }
  };

  const signOut = async () => {
    try {
      setError(null);
      setIsLoading(true);
      await supabase.auth.signOut();
      setUser(null);
    } catch (err) {
      console.error('Error signing out:', err);
      setError('Failed to sign out');
    } finally {
      setIsLoading(false);
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
        updateUser: setUser,
      }}
    >
      {error && (
        <Text style={{ color: 'red' }}>{error}</Text>
      )}
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
