import { useState, useEffect, useCallback } from 'react';
import * as WebBrowser from 'expo-web-browser';
import * as Google from 'expo-auth-session/providers/google';
import Constants from 'expo-constants';
import { User } from '../types/auth.types';
import { Logger } from '../../../utils/error/Logger';
import { authService } from '../services/AuthService';

WebBrowser.maybeCompleteAuthSession();

export interface UseGoogleAuthReturn {
  signInWithGoogle: () => Promise<void>;
  isLoading: boolean;
  error: string | null;
}

export function useGoogleAuth(): UseGoogleAuthReturn {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

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

  const handleGoogleSignIn = async (idToken: string): Promise<User | null> => {
    if (!idToken) {
      Logger.error('Invalid Google ID token', {
        context: 'googleSignIn',
        timestamp: new Date().toISOString()
      });
      throw new Error('Invalid Google authentication token');
    }

    try {
      Logger.info('Starting Google sign-in process', {
        timestamp: new Date().toISOString(),
        context: 'googleSignIn'
      });

      const user = await authService.signInWithGoogle(idToken);
      
      Logger.info('Google sign-in successful', {
        userId: user?.id,
        timestamp: new Date().toISOString(),
        context: 'googleSignIn',
        isNewUser: user?.createdAt === user?.updatedAt
      });

      return user;
    } catch (error) {
      Logger.error('Google sign-in failed', {
        error,
        timestamp: new Date().toISOString(),
        context: 'googleSignIn'
      });
      throw error;
    }
  };

  // Handle Google Auth Response
  useEffect(() => {
    let isHandling = false;

    const handleResponse = async () => {
      if (isHandling || !response) return;
      isHandling = true;

      try {
        if (response.type === 'success') {
          const { id_token } = response.params;
          await handleGoogleSignIn(id_token);
        } else if (response.type === 'error') {
          throw new Error(response.error?.message || 'Failed to authenticate with Google');
        }
      } catch (error) {
        setError(error instanceof Error ? error.message : 'Authentication error');
      } finally {
        isHandling = false;
        setIsLoading(false);
      }
    };

    handleResponse();
  }, [response]);

  const signInWithGoogle = useCallback(async () => {
    if (isLoading) {
      Logger.info('Google sign-in operation already in progress');
      return;
    }

    try {
      setIsLoading(true);
      setError(null);
      
      if (!request) {
        throw new Error('Google Auth request was not initialized');
      }
      
      await promptAsync();
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to initiate Google sign-in');
      setIsLoading(false);
    }
  }, [isLoading, request, promptAsync]);

  return {
    signInWithGoogle,
    isLoading,
    error
  };
}