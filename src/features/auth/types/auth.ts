import { User as SupabaseUser } from '@supabase/supabase-js';

export type User = {
  id: string;
  email: string;
  displayName?: string;
  photoURL?: string;
  lastSignOutAt?: string;
  createdAt?: string;
  updatedAt?: string;
};

export const mapSupabaseUser = (user: SupabaseUser): User => ({
  id: user.id,
  email: user.email || '',
  displayName: user.user_metadata?.full_name,
  photoURL: user.user_metadata?.avatar_url,
  createdAt: user.created_at,
  updatedAt: user.updated_at,
  lastSignOutAt: user.last_sign_in_at,
});

export type AuthState = {
  isAuthenticated: boolean;
  user: User | null;
  isLoading: boolean;
  error: string | null;
};

export type AuthContextType = AuthState & {
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string) => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  logout: () => Promise<void>;
};
