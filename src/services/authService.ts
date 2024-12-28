import { supabase } from './supabaseClient';
import { User } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface AppUser {
  id: string;
  email: string;
  displayName: string;
  photoUrl?: string;
}

class AuthService {
  private static instance: AuthService;
  private currentUser: AppUser | null = null;
  private listeners: Set<(user: AppUser | null) => void> = new Set();

  private constructor() {
    this.initializeAuth();
  }

  private async initializeAuth() {
    // Check for existing session first
    const { data: { session } } = await supabase.auth.getSession();
    if (session?.user) {
      this.currentUser = await this.createAppUserFromSupabaseUser(session.user);
      this.notifyListeners();
    }

    // Then set up listener for future changes
    supabase.auth.onAuthStateChange(async (event, session) => {
      if (session?.user) {
        const appUser = await this.createAppUserFromSupabaseUser(session.user);
        this.currentUser = appUser;
      } else {
        this.currentUser = null;
      }
      this.notifyListeners();
    });
  }

  private async createAppUserFromSupabaseUser(supabaseUser: User): Promise<AppUser> {
    // Get or create user profile
    const { data: profile } = await supabase
      .from('users')
      .select('*')
      .eq('id', supabaseUser.id)
      .single();

    if (!profile) {
      const newProfile = {
        id: supabaseUser.id,
        email: supabaseUser.email!,
        display_name: supabaseUser.user_metadata.full_name || supabaseUser.email!.split('@')[0],
        photo_url: supabaseUser.user_metadata.avatar_url,
        settings: {
          measurementSystem: 'metric',
          notifications: true,
          privacyLevel: 'private'
        }
      };

      await supabase.from('users').insert([newProfile]);
      return {
        id: newProfile.id,
        email: newProfile.email,
        displayName: newProfile.display_name,
        photoUrl: newProfile.photo_url
      };
    }

    return {
      id: profile.id,
      email: profile.email,
      displayName: profile.display_name,
      photoUrl: profile.photo_url
    };
  }

  public static getInstance(): AuthService {
    if (!AuthService.instance) {
      AuthService.instance = new AuthService();
    }
    return AuthService.instance;
  }

  public async signInWithGoogle(accessToken: string): Promise<void> {
    const { error } = await supabase.auth.signInWithIdToken({
      provider: 'google',
      token: accessToken,
    });

    if (error) throw error;
  }

  public async signOut(): Promise<void> {
    await supabase.auth.signOut();
    await AsyncStorage.clear();
  }

  public async getCurrentUser(): Promise<AppUser | null> {
    const session = await supabase.auth.getSession();
    if (session?.data.session?.user) {
      return this.createAppUserFromSupabaseUser(session.data.session.user);
    }
    return null;
  }

  public addAuthStateListener(listener: (user: AppUser | null) => void): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  private notifyListeners(): void {
    this.listeners.forEach(listener => listener(this.currentUser));
  }
}

export default AuthService.getInstance();
