import { supabase } from '@utils/supabase';
import { User, AuthCredentials, mapSupabaseUser, GoogleAuthResponse } from '../types/auth.types';
import { SessionManager } from './SessionManager';
import { TokenManager } from './TokenManager';
import { Logger } from '@utils/error/Logger';
import { SessionExpiredError, TokenRefreshError } from '../errors/AuthErrors';
import { Platform } from 'react-native';
import DeviceInfo from 'react-native-device-info';
import * as SecureStore from 'expo-secure-store';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { StorageService } from '@core/storage/StorageService';

export class AuthService {
  private static instance: AuthService;
  private sessionManager: SessionManager;
  private tokenManager: TokenManager;

  private constructor() {
    this.sessionManager = SessionManager.getInstance();
    this.tokenManager = TokenManager.getInstance();
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
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;
      if (!data.user || !data.session) {
        throw new Error('No user data or session returned');
      }

      const user = mapSupabaseUser(data.user);
      await this.handleSuccessfulAuth(data.session, user);
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
      
      // Exchange the Google ID token for Supabase session
      const { data: { user, session }, error } = await supabase.auth.signInWithIdToken({
        provider: 'google',
        token: idToken,
        nonce: undefined // Supabase will generate a nonce automatically
      });

      if (error) throw error;
      if (!user || !session) {
        throw new Error('No user data or session returned from Supabase');
      }

      // Store Google auth token securely
      await this.storeTokenSecurely('google_id_token', idToken);
      
      // Map user and handle auth
      const mappedUser = mapSupabaseUser(user);
      await this.handleSuccessfulAuth(session, mappedUser);

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
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
      });

      if (error) throw error;
      if (!data.user || !data.session) {
        throw new Error('No user data or session returned');
      }

      const user = mapSupabaseUser(data.user);
      await this.handleSuccessfulAuth(data.session, user);
      return user;
    } catch (error) {
      Logger.error('Email sign-up failed', { error, email });
      throw this.handleError(error, 'signUpWithEmail');
    }
  }

  public async clearAuthData(): Promise<void> {
    try {
      // Sign out from Supabase
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      
      // Clear secure storage
      await SecureStore.deleteItemAsync('access_token');
      await SecureStore.deleteItemAsync('refresh_token');
      await SecureStore.deleteItemAsync('google_id_token');
      
      // Clear stored tokens and user data
      await StorageService.clearAll();
      
      // Clear any other auth-related storage
      await AsyncStorage.multiRemove([
        '@health_permissions_granted',
        // Add any other auth-related keys that need to be cleared
      ]);

      // Clear local session
      await this.sessionManager.clearSession();
      
      Logger.info('Auth data cleared successfully');
    } catch (error) {
      Logger.error('Failed to clear auth data', { error });
      throw this.handleError(error, 'clearAuthData');
    }
  }

  public async initializeAuth(): Promise<User | null> {
    try {
      Logger.info('Initializing auth...');
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError) throw sessionError;
      if (!session) {
        Logger.info('No existing auth session found');
        return null;
      }

      const { data: { user }, error } = await supabase.auth.getUser();
      if (error) throw error;
      if (!user) return null;

      const mappedUser = mapSupabaseUser(user);
      await this.handleSuccessfulAuth(session, mappedUser);
      return mappedUser;
    } catch (error) {
      Logger.error('Auth initialization failed', { error });
      throw this.handleError(error, 'initializeAuth');
    }
  }

  public async refreshSession(): Promise<User> {
    try {
      const { data: { session }, error } = await supabase.auth.refreshSession();
      if (error) throw error;
      if (!session?.user) {
        throw new Error('No user data or session returned');
      }

      const user = mapSupabaseUser(session.user);
      await this.handleSuccessfulAuth(session, user);
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
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_, session) => {
      try {
        if (session?.user) {
          const mappedUser = mapSupabaseUser(session.user);
          await this.handleSuccessfulAuth(session, mappedUser);
          callback(mappedUser);
        } else {
          callback(null);
        }
      } catch (error) {
        Logger.error('Auth state change handler failed', { error });
        callback(null);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
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

  private async handleSuccessfulAuth(
    session: any,
    user: User
  ): Promise<void> {
    try {
      // Create new session
      const deviceId = await DeviceInfo.getUniqueId();
      const newSession = {
        accessToken: session.access_token,
        refreshToken: session.refresh_token,
        expiresAt: Date.now() + (session.expires_in * 1000),
        userId: user.id,
        deviceId,
        lastValidated: Date.now(),
        validationInterval: 5 * 60 * 1000, // 5 minutes
      };

      // Validate token
      const isValid = await this.tokenManager.validateToken(session.access_token);
      if (!isValid) {
        throw new TokenRefreshError({ message: 'Invalid token received' });
      }

      // Store tokens securely
      await this.storeTokenSecurely('access_token', session.access_token);
      await this.storeTokenSecurely('refresh_token', session.refresh_token);

      // Set session
      await this.sessionManager.setSession(newSession);

      Logger.info('Authentication successful', { userId: user.id });
    } catch (error) {
      Logger.error('Failed to handle successful auth', { error });
      throw error;
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
