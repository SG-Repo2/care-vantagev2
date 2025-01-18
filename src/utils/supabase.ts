import { createClient, SupabaseClient, RealtimeChannel, AuthResponse, User, Session, PostgrestError } from '@supabase/supabase-js';
import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';
import Constants from 'expo-constants';
import { handleSupabaseError } from '../core/supabase/SupabaseErrorHelper';
import type { Database } from '../types/supabase';

// Get Supabase configuration from environment variables
const supabaseUrl = 'https://jnxsqqsbhzirijklxqbq.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpueHNxcXNiaHppcmlqa2x4cWJxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzUzNDA0MDksImV4cCI6MjA1MDkxNjQwOX0.GQ8a8zlHkldvvamERaz1sVakkyvbwMtDWn1N7b0n3bI';

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase configuration');
}

// Create the Supabase client with proper database typing
export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
    storage: {
      async getItem(key: string) {
        try {
          return await SecureStore.getItemAsync(key);
        } catch (error) {
          console.error('Error reading from secure storage:', error);
          return null;
        }
      },
      async setItem(key: string, value: string) {
        try {
          await SecureStore.setItemAsync(key, value);
        } catch (error) {
          console.error('Error writing to secure storage:', error);
        }
      },
      async removeItem(key: string) {
        try {
          await SecureStore.deleteItemAsync(key);
        } catch (error) {
          console.error('Error removing from secure storage:', error);
        }
      },
    },
  },
});

type TableName = keyof Database['public']['Tables'];
type TableRow<T extends TableName> = Database['public']['Tables'][T]['Row'];
type TableInsert<T extends TableName> = Database['public']['Tables'][T]['Insert'];
type TableUpdate<T extends TableName> = Database['public']['Tables'][T]['Update'];

type RealtimePayload<T> = {
  new: T;
  old: T;
  eventType: 'INSERT' | 'UPDATE' | 'DELETE';
};

// Helper function to safely cast database results
function castDatabaseResult<T>(data: unknown): T[] {
  if (Array.isArray(data)) {
    return data as T[];
  }
  return [];
}

// Wrapper for common database operations with proper error handling
export const db = {
  async select<T extends TableName>(
    table: T,
    query: string = '*',
    options: {
      filter?: any;
      orderBy?: { column: string; ascending?: boolean };
      limit?: number;
      offset?: number;
    } = {}
  ): Promise<TableRow<T>[]> {
    try {
      let queryBuilder = supabase
        .from(table)
        .select(query);

      if (options.filter) {
        queryBuilder = queryBuilder.match(options.filter);
      }

      if (options.orderBy) {
        queryBuilder = queryBuilder.order(
          options.orderBy.column,
          { ascending: options.orderBy.ascending ?? true }
        );
      }

      if (options.limit) {
        queryBuilder = queryBuilder.limit(options.limit);
      }

      if (options.offset) {
        queryBuilder = queryBuilder.range(
          options.offset,
          options.offset + (options.limit || 10) - 1
        );
      }

      const { data, error } = await queryBuilder;
      if (error) throw error;
      return castDatabaseResult<TableRow<T>>(data);
    } catch (error) {
      if (error instanceof Error || error instanceof PostgrestError) {
        throw handleSupabaseError(error);
      }
      throw error;
    }
  },

  async insert<T extends TableName>(
    table: T,
    data: TableInsert<T> | TableInsert<T>[],
    options: { returning?: 'minimal' | 'representation' } = {}
  ): Promise<TableRow<T>[]> {
    try {
      const { data: result, error } = await supabase
        .from(table)
        .insert(data)
        .select(options.returning === 'representation' ? '*' : undefined);
      
      if (error) throw error;
      return castDatabaseResult<TableRow<T>>(result);
    } catch (error) {
      if (error instanceof Error || error instanceof PostgrestError) {
        throw handleSupabaseError(error);
      }
      throw error;
    }
  },

  async update<T extends TableName>(
    table: T,
    data: TableUpdate<T>,
    match: Partial<TableRow<T>>
  ): Promise<TableRow<T>[]> {
    try {
      const { data: result, error } = await supabase
        .from(table)
        .update(data)
        .match(match)
        .select();
      
      if (error) throw error;
      return castDatabaseResult<TableRow<T>>(result);
    } catch (error) {
      if (error instanceof Error || error instanceof PostgrestError) {
        throw handleSupabaseError(error);
      }
      throw error;
    }
  },

  async delete<T extends TableName>(
    table: T,
    match: Partial<TableRow<T>>,
    options: { returning?: boolean } = { returning: false }
  ): Promise<TableRow<T>[]> {
    try {
      const query = supabase
        .from(table)
        .delete()
        .match(match);

      if (options.returning) {
        const { data: result, error } = await query.select();
        if (error) throw error;
        return castDatabaseResult<TableRow<T>>(result);
      } else {
        const { error } = await query;
        if (error) throw error;
        return [];
      }
    } catch (error) {
      if (error instanceof Error || error instanceof PostgrestError) {
        throw handleSupabaseError(error);
      }
      throw error;
    }
  },

  // Helper for realtime subscriptions
  subscribe<T extends TableName>(
    table: T,
    callback: (payload: TableRow<T>) => void,
    event: 'INSERT' | 'UPDATE' | 'DELETE' = 'INSERT'
  ): RealtimeChannel {
    return supabase.channel('db_changes')
      .on<TableRow<T>>(
        'postgres_changes' as any,
        { 
          event: event.toLowerCase(),
          schema: 'public',
          table: String(table)
        },
        (payload: RealtimePayload<TableRow<T>>) => {
          if (payload.new) {
            callback(payload.new);
          }
        }
      )
      .subscribe();
  },

  // Auth helpers
  auth: {
    async signInWithEmail(email: string, password: string): Promise<AuthResponse> {
      try {
        const response = await supabase.auth.signInWithPassword({ email, password });
        if (response.error) throw response.error;
        return response;
      } catch (error) {
        if (error instanceof Error || error instanceof PostgrestError) {
          throw handleSupabaseError(error);
        }
        throw error;
      }
    },

    async signInWithGoogle(idToken: string): Promise<AuthResponse> {
      try {
        const response = await supabase.auth.signInWithIdToken({
          provider: 'google',
          token: idToken,
        });
        if (response.error) throw response.error;
        return response;
      } catch (error) {
        if (error instanceof Error || error instanceof PostgrestError) {
          throw handleSupabaseError(error);
        }
        throw error;
      }
    },

    async signOut(): Promise<void> {
      try {
        const { error } = await supabase.auth.signOut();
        if (error) throw error;
      } catch (error) {
        if (error instanceof Error || error instanceof PostgrestError) {
          throw handleSupabaseError(error);
        }
        throw error;
      }
    },

    async getCurrentUser(): Promise<User | null> {
      try {
        const { data: { user }, error } = await supabase.auth.getUser();
        if (error) throw error;
        return user;
      } catch (error) {
        if (error instanceof Error || error instanceof PostgrestError) {
          throw handleSupabaseError(error);
        }
        throw error;
      }
    },

    onAuthStateChange(callback: (user: User | null) => void): () => void {
      const { data: { subscription } } = supabase.auth.onAuthStateChange((_, session) => {
        callback(session?.user ?? null);
      });
      return () => subscription.unsubscribe();
    },

    async refreshSession(): Promise<Session | null> {
      try {
        const { data: { session }, error } = await supabase.auth.refreshSession();
        if (error) throw error;
        return session;
      } catch (error) {
        if (error instanceof Error || error instanceof PostgrestError) {
          throw handleSupabaseError(error);
        }
        throw error;
      }
    }
  }
};

export type { Database, TableName, TableRow, TableInsert, TableUpdate };
