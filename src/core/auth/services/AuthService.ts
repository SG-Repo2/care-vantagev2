import { supabase } from '@utils/supabase';
import { User, AuthCredentials, mapSupabaseUser, GoogleAuthResponse } from '../types/auth.types';
import { SessionManager } from './SessionManager';
import { TokenManager } from './TokenManager';
import { Logger } from '@utils/error/Logger';
import { SessionExpiredError, TokenRefreshError } from '../errors/AuthErrors';
import { Platform } from 'react-native';
import DeviceInfo from 'react-native-device-info';
import * as SecureStore from 'expo-secure-store';

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
   * Sign in with Google OAuth token
   */
  public async signInWithGoogle(idToken: string): Promise<User> {
    try {
      // Exchange the Google ID token for Supabase session
      const { data: { user, session }, error } = await supabase.auth.signInWithIdToken({
        provider: 'google',
        token: idToken,
        nonce: undefined // Supabase will generate a nonce automatically
      });

      if (error) throw error;
      if (!user || !session) {
        throw new Error('No user data or session returned');
      }

      // Store Google auth tokens securely
      await this.storeTokenSecurely('google_id_token', idToken);
      
      // Create GoogleAuthResponse for type safety
      const googleAuthResponse: GoogleAuthResponse = {
        idToken,
        accessToken: session.access_token,
        user: {
          id: user.id,
          email: user.email || '',
          displayName: user.user_metadata?.full_name,
          photoURL: user.user_metadata?.avatar_url
        }
      };

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

  /**
   * Sign out the current user
   */
  public async signOut(): Promise<void> {
    try {
      // Get current token before signing out
      const token = await this.getAccessToken();
      
      // Sign out from Supabase
      const { error } = await supabase.auth.signOut();
      if (error) throw error;

      // Revoke the token
      if (token) {
        await this.tokenManager.revokeToken(token);
      }

      // Clear secure storage
      await SecureStore.deleteItemAsync('access_token');
      await SecureStore.deleteItemAsync('refresh_token');

      // Clear local session
      await this.sessionManager.clearSession();

      Logger.info('User signed out successfully');
    } catch (error) {
      Logger.error('Sign-out failed', { error });
      throw this.handleError(error, 'signOut');
    }
  }

  /**
   * Check if user is authenticated
   */
  public isAuthenticated(): boolean {
    return this.sessionManager.isAuthenticated();
  }

  /**
   * Get current user's access token
   */
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
        await this.signOut();
      }
      throw error;
    }
  }

  /**
   * Handle successful authentication
   */
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

  /**
   * Handle authentication errors
   */
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

  /**
   * Get active sessions for the current user
   */
  public async getActiveSessions() {
    return this.sessionManager.getActiveSessions();
  }

  /**
   * Revoke a specific session
   */
  public async revokeSession(deviceId: string): Promise<void> {
    await this.sessionManager.revokeSession(deviceId);
  }
}

// Export a singleton instance
export const authService = AuthService.getInstance();
