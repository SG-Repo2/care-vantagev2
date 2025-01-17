import { supabase } from '@utils/supabase';
import { handleSupabaseError } from './SupabaseErrorHelper';
import { AuthResponse, Provider, User, UserResponse, Session } from '@supabase/supabase-js';
import { Logger } from '@utils/error/Logger';
import * as SecureStore from 'expo-secure-store';
import { SessionManager } from '../auth/services/SessionManager';
import DeviceInfo from 'react-native-device-info';
import { TokenRefreshError } from '../auth/errors/AuthErrors';

export class SupabaseGateway {
  private static _instance: SupabaseGateway;
  private sessionManager: SessionManager;

  private constructor() {
    this.sessionManager = SessionManager.getInstance();
  }

  public static getInstance(): SupabaseGateway {
    if (!SupabaseGateway._instance) {
      SupabaseGateway._instance = new SupabaseGateway();
    }
    return SupabaseGateway._instance;
  }

  private async handleSuccessfulAuth(session: Session, user: User): Promise<void> {
    try {
      // Create new session
      const deviceId = await DeviceInfo.getUniqueId();
      const newSession = {
        accessToken: session.access_token,
        refreshToken: session.refresh_token,
        expiresAt: new Date(session.expires_at!).getTime(),
        userId: user.id,
        deviceId,
        lastValidated: Date.now(),
        validationInterval: 5 * 60 * 1000, // 5 minutes
      };

      // Validate token structure and check blacklist
      const isValid = await this.sessionManager['validateTokenStructure'](session.access_token);
      if (!isValid) {
        throw new TokenRefreshError({ message: 'Invalid token received or token is blacklisted' });
      }

      // Store tokens securely
      await SecureStore.setItemAsync('access_token', session.access_token);
      await SecureStore.setItemAsync('refresh_token', session.refresh_token);

      // Set session
      await this.sessionManager.setSession(newSession);

      Logger.info('Authentication successful', { userId: user.id });
    } catch (error) {
      Logger.error('Failed to handle successful auth', { error });
      throw error;
    }
  }

  // Auth Methods
  async signInWithEmail(email: string, password: string): Promise<AuthResponse> {
    try {
      const response = await supabase.auth.signInWithPassword({ email, password });
      if (response.error) throw response.error;
      if (!response.data.user || !response.data.session) {
        throw new Error('No user data or session returned');
      }

      await this.handleSuccessfulAuth(response.data.session, response.data.user);
      return response;
    } catch (error) {
      Logger.error('Email sign-in failed', { error, email });
      throw handleSupabaseError(error as Error);
    }
  }

  async signUpWithEmail(email: string, password: string): Promise<AuthResponse> {
    try {
      const response = await supabase.auth.signUp({ email, password });
      if (response.error) throw response.error;
      if (!response.data.user || !response.data.session) {
        throw new Error('No user data or session returned');
      }

      await this.handleSuccessfulAuth(response.data.session, response.data.user);
      return response;
    } catch (error) {
      Logger.error('Email sign-up failed', { error, email });
      throw handleSupabaseError(error as Error);
    }
  }

  async signInWithGoogle(idToken: string): Promise<AuthResponse> {
    try {
      Logger.info('Starting Google sign-in with ID token');
      
      const response = await supabase.auth.signInWithIdToken({
        provider: 'google',
        token: idToken,
        nonce: undefined // Supabase will generate a nonce automatically
      });

      if (response.error) throw response.error;
      if (!response.data.user || !response.data.session) {
        throw new Error('No user data or session returned from Supabase');
      }

      // Store Google auth token securely
      await SecureStore.setItemAsync('google_id_token', idToken);
      
      await this.handleSuccessfulAuth(response.data.session, response.data.user);
      Logger.info('Google sign-in successful', { userId: response.data.user.id });
      
      return response;
    } catch (error) {
      Logger.error('Google sign-in failed', { error });
      throw handleSupabaseError(error as Error);
    }
  }

  async signOut(): Promise<void> {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      
      // Clear secure storage
      await SecureStore.deleteItemAsync('access_token');
      await SecureStore.deleteItemAsync('refresh_token');
      await SecureStore.deleteItemAsync('google_id_token');
      
      // Clear session
      await this.sessionManager.clearSession();
      
      Logger.info('Sign out successful');
    } catch (error) {
      Logger.error('Sign out failed', { error });
      throw handleSupabaseError(error as Error);
    }
  }

  async refreshSession(): Promise<AuthResponse> {
    try {
      const response = await supabase.auth.refreshSession();
      if (response.error) throw response.error;
      if (!response.data.session?.user) {
        throw new Error('No user data or session returned');
      }

      await this.handleSuccessfulAuth(response.data.session, response.data.session.user);
      return response;
    } catch (error) {
      Logger.error('Session refresh failed', { error });
      throw handleSupabaseError(error as Error);
    }
  }

  async getCurrentUser(): Promise<User | null> {
    try {
      const { data: { user }, error } = await supabase.auth.getUser();
      if (error) throw error;
      return user;
    } catch (error) {
      Logger.error('Get current user failed', { error });
      throw handleSupabaseError(error as Error);
    }
  }

  subscribeToAuthChanges(callback: (user: User | null) => void): () => void {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_, session) => {
      try {
        if (session?.user) {
          await this.handleSuccessfulAuth(session, session.user);
          callback(session.user);
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

  // Database Methods
  from(table: string) {
    return supabase.from(table);
  }

  async select<T = any>(
    table: string,
    query: { 
      columns?: string; 
      filter?: any;
      orderBy?: { column: string; ascending?: boolean };
      limit?: number;
      offset?: number;
    }
  ): Promise<T[]> {
    try {
      Logger.info(`Selecting from ${table}`, { query });
      
      const baseQuery = supabase
        .from(table)
        .select(query.columns || '*');

      if (query.filter) {
        baseQuery.match(query.filter);
      }

      if (query.orderBy) {
        baseQuery.order(
          query.orderBy.column, 
          { ascending: query.orderBy.ascending ?? true }
        );
      }

      if (query.limit) {
        baseQuery.limit(query.limit);
      }

      if (query.offset) {
        baseQuery.range(
          query.offset,
          query.offset + (query.limit || 10) - 1
        );
      }

      const { data, error } = await baseQuery;
      if (error) throw error;
      return data as T[];
    } catch (error) {
      Logger.error(`Failed to select from ${table}`, { error, query });
      throw handleSupabaseError(error as Error);
    }
  }

  async insert<T = any>(
    table: string,
    data: Partial<T> | Partial<T>[],
    options: { returning?: boolean } = { returning: true }
  ): Promise<T[]> {
    try {
      Logger.info(`Inserting into ${table}`, { data });
      
      const baseQuery = supabase
        .from(table)
        .insert(data);

      if (!options.returning) {
        const { error } = await baseQuery;
        if (error) throw error;
        return [] as T[];
      }

      const { data: result, error } = await baseQuery.select();
      if (error) throw error;
      return (result || []) as T[];
    } catch (error) {
      Logger.error(`Failed to insert into ${table}`, { error, data });
      throw handleSupabaseError(error as Error);
    }
  }

  async update<T = any>(
    table: string,
    data: Partial<T>,
    match: Partial<T>,
    options: { returning?: boolean } = { returning: true }
  ): Promise<T[]> {
    try {
      Logger.info(`Updating ${table}`, { data, match });
      
      const baseQuery = supabase
        .from(table)
        .update(data)
        .match(match);

      if (!options.returning) {
        const { error } = await baseQuery;
        if (error) throw error;
        return [] as T[];
      }

      const { data: result, error } = await baseQuery.select();
      if (error) throw error;
      return (result || []) as T[];
    } catch (error) {
      Logger.error(`Failed to update ${table}`, { error, data, match });
      throw handleSupabaseError(error as Error);
    }
  }

  async delete<T = any>(
    table: string,
    match: Partial<T>,
    options: { returning?: boolean } = { returning: false }
  ): Promise<T[]> {
    try {
      Logger.info(`Deleting from ${table}`, { match });
      
      const baseQuery = supabase
        .from(table)
        .delete()
        .match(match);

      if (!options.returning) {
        const { error } = await baseQuery;
        if (error) throw error;
        return [] as T[];
      }

      const { data: result, error } = await baseQuery.select();
      if (error) throw error;
      return (result || []) as T[];
    } catch (error) {
      Logger.error(`Failed to delete from ${table}`, { error, match });
      throw handleSupabaseError(error as Error);
    }
  }

  // Storage Methods
  storage() {
    return supabase.storage;
  }

  // Realtime Methods
  channel(name: string) {
    Logger.info(`Creating realtime channel: ${name}`);
    return supabase.channel(name);
  }
}

// Export a singleton instance
export const supabaseGateway = SupabaseGateway.getInstance();