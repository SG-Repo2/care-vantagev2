import type { User as SupabaseUser, Session } from '@supabase/supabase-js';

export type User = SupabaseUser;
export type { Session };

export type AuthStatus = 'initializing' | 'authenticated' | 'unauthenticated' | 'error';

export interface AuthState {
  user: User | null;
  session: Session | null;
  status: AuthStatus;
  error: string | null;
}
