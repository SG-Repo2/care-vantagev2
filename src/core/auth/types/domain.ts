import type { User as SupabaseUser, Session } from '@supabase/supabase-js';

// Re-export Supabase types
export type User = SupabaseUser;
export type { Session };

// Auth status types
export type AuthStatus = 'initializing' | 'authenticated' | 'unauthenticated' | 'error';

// Core auth state interface
export interface AuthState {
  user: User | null;
  session: Session | null;
  status: AuthStatus;
  error: string | null;
}

// Auth provider capabilities
export interface AuthCapabilities {
  signIn: (email: string, password: string) => Promise<void>;
  signInWithGoogle: (idToken: string) => Promise<void>;
  signOut: () => Promise<void>;
  refreshSession: () => Promise<void>;
}