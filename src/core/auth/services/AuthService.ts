import { User, AuthCredentials, mapSupabaseUser, GoogleAuthResponse } from '../types/auth.types';
import { SessionManager } from './SessionManager';
import { Logger } from '@utils/error/Logger';
import { SessionExpiredError, TokenRefreshError } from '../errors/AuthErrors';
import { Platform } from 'react-native';
import DeviceInfo from 'react-native-device-info';
import * as SecureStore from 'expo-secure-store';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { StorageService } from '@core/storage/StorageService';
import { supabaseGateway } from '@core/supabase/SupabaseGateway';

export class AuthService {
  private static instance: AuthService;
  private sessionManager: SessionManager;

  private constructor() {
    this.sessionManager = SessionManager.getInstance();
  }

  public static getInstance(): AuthService {
    if (!AuthService.instance) {
      AuthService.instance = new AuthService();
    }
    return AuthService.instance;
  }

  /**
   * Sign in with email and password
   */
  public async signInWithEmail(email: string, password: string): Promise<User> {
    try {
      const response = await supabaseGateway.signInWithEmail(email, password);
      if (!response.data.user || !response.data.session) {
        throw new Error('No user data or session returned');
      }

      const user = mapSupabaseUser(response.data.user);
      return user;
    } catch (error) {
      Logger.error('Email sign-in failed', { error, email });
      throw this.handleError(error, 'signInWithEmail');
    }
  }

  /**
   * Sign in with Google OAuth token from Expo Auth Session
   */
  public async signInWithGoogle(idToken: string): Promise<User> {
    try {
      Logger.info('Starting Google sign-in with ID token');
      
      const response = await supabaseGateway.signInWithGoogle(idToken);
      if (!response.data.user || !response.data.session) {
        throw new Error('No user data or session returned from Supabase');
      }

      const mappedUser = mapSupabaseUser(response.data.user);
      Logger.info('Google sign-in successful', { userId: mappedUser.id });
      return mappedUser;
    } catch (error) {
      Logger.error('Google sign-in failed', { error });
      throw this.handleError(error, 'signInWithGoogle');
    }
  }

  /**
   * Sign up with email and password
   */
  public async signUpWithEmail(email: string, password: string): Promise<User> {
    try {
      const response = await supabaseGateway.signUpWithEmail(email, password);
      if (!response.data.user || !response.data.session) {
        throw new Error('No user data or session returned');
      }

      const user = mapSupabaseUser(response.data.user);
      return user;
    } catch (error) {
      Logger.error('Email sign-up failed', { error, email });
      throw this.handleError(error, 'signUpWithEmail');
    }
  }

  public async clearAuthData(): Promise<void> {
    try {
      await supabaseGateway.signOut();
      
      // Clear stored tokens and user data
      await StorageService.clearAll();
      
      // Clear any other auth-related storage
      await AsyncStorage.multiRemove([
        '@health_permissions_granted',
        // Add any other auth-related keys that need to be cleared
      ]);
      
      Logger.info('Auth data cleared successfully');
    } catch (error) {
      Logger.error('Failed to clear auth data', { error });
      throw this.handleError(error, 'clearAuthData');
    }
  }

  public async initializeAuth(): Promise<User | null> {
    try {
      Logger.info('Initializing auth...');
      const user = await supabaseGateway.getCurrentUser();
      if (!user) {
        Logger.info('No existing auth session found');
        return null;
      }

      const mappedUser = mapSupabaseUser(user);
      return mappedUser;
    } catch (error) {
      Logger.error('Auth initialization failed', { error });
      throw this.handleError(error, 'initializeAuth');
    }
  }

  public async refreshSession(): Promise<User> {
    try {
      const response = await supabaseGateway.refreshSession();
      if (!response.data.session?.user) {
        throw new Error('No user data or session returned');
      }

      const user = mapSupabaseUser(response.data.session.user);
      return user;
    } catch (error) {
      Logger.error('Session refresh failed', { error });
      throw this.handleError(error, 'refreshSession');
    }
  }

  public async getAccessToken(): Promise<string> {
    try {
      // First try to get token from secure storage
      const secureToken = await this.getTokenSecurely('access_token');
      if (secureToken) {
        return secureToken;
      }

      // Fallback to session manager if not in secure storage
      const sessionToken = await this.sessionManager.getAccessToken();
      if (sessionToken) {
        // Store in secure storage for future use
        await this.storeTokenSecurely('access_token', sessionToken);
        return sessionToken;
      }

      throw new SessionExpiredError({ message: 'No valid access token found' });
    } catch (error) {
      if (error instanceof SessionExpiredError) {
        // Handle session expiry
        await this.clearAuthData();
      }
      throw error;
    }
  }

  public subscribeToAuthChanges(callback: (user: User | null) => void): () => void {
    return supabaseGateway.subscribeToAuthChanges((user) => {
      try {
        if (user) {
          const mappedUser = mapSupabaseUser(user);
          callback(mappedUser);
        } else {
          callback(null);
        }
      } catch (error) {
        Logger.error('Error in auth subscription callback', { error });
        // Ensure we still update the auth state even if mapping fails
        callback(null);
      }
    });
  }

  private async storeTokenSecurely(key: string, token: string): Promise<void> {
    try {
      await SecureStore.setItemAsync(key, token);
    } catch (error) {
      Logger.error('Failed to store token securely', { error });
      throw error;
    }
  }

  private async getTokenSecurely(key: string): Promise<string | null> {
    try {
      return await SecureStore.getItemAsync(key);
    } catch (error) {
      Logger.error('Failed to retrieve token', { error });
      return null;
    }
  }

  private handleError(error: any, context: string): Error {
    // Log the error with context
    Logger.error(`Auth error in ${context}:`, { error });

    // Map specific error types
    if (error instanceof SessionExpiredError || error instanceof TokenRefreshError) {
      return error;
    }

    // Handle Supabase specific errors
    if (error.status === 401) {
      return new SessionExpiredError({ originalError: error });
    }

    // Return generic error if no specific handling
    return error instanceof Error ? error : new Error(error?.message || 'Authentication error');
  }

  public async getActiveSessions() {
    return this.sessionManager.getActiveSessions();
  }

  public async revokeSession(deviceId: string): Promise<void> {
    await this.sessionManager.revokeSession(deviceId);
  }
}

// Export a singleton instance
export const authService = AuthService.getInstance();
