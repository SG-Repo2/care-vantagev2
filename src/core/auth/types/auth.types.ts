import { User as SupabaseUser } from '@supabase/supabase-js';

export interface AuthState {
  isAuthenticated: boolean;
  user: User | null;
  isLoading: boolean;
  error: string | null;
}

export interface AuthContextType extends AuthState {
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string) => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  logout: () => Promise<void>;
  refreshSession: () => Promise<void>;
  getAccessToken: () => Promise<string>;
}

export interface GoogleAuthResponse {
  idToken: string;
  accessToken: string;
  user: {
    id: string;
    email: string;
    displayName?: string;
    photoURL?: string;
  };
}

export interface AuthCredentials {
  email?: string;
  password?: string;
  idToken?: string;
  provider?: 'email' | 'google';
}

export interface User {
  id: string;
  email: string;
  displayName?: string;
  photoURL?: string | null;
  lastSignOutAt?: string;
  createdAt?: string;
  updatedAt?: string;
  settings: {
    measurementSystem: 'metric' | 'imperial';
    notifications: boolean;
    privacyLevel: 'private' | 'friends' | 'public';
    dailyGoals: {
      steps: number;
      sleep: number;
      water: number;
    };
  };
}

export const mapSupabaseUser = (user: SupabaseUser): User => ({
  id: user.id,
  email: user.email || '',
  displayName: user.user_metadata?.full_name,
  photoURL: user.user_metadata?.avatar_url,
  createdAt: user.created_at,
  updatedAt: user.updated_at,
  lastSignOutAt: user.last_sign_in_at,
  settings: {
    measurementSystem: 'metric',
    notifications: true,
    privacyLevel: 'private',
    dailyGoals: {
      steps: 10000,
      sleep: 480,
      water: 2000
    }
  }
});
