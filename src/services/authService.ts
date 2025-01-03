import { supabase } from '../utils/supabase';
import { User as SupabaseUser } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { User, mapSupabaseUser } from '../features/auth/types/auth';

class AuthService {
  private static instance: AuthService;
  private currentUser: User | null = null;
  private listeners: Set<(user: User | null) => void> = new Set();

  private constructor() {
    this.initializeAuth();
  }

  private async initializeAuth() {
    const { data: { session } } = await supabase.auth.getSession();
    if (session?.user) {
      this.currentUser = await this.createAppUserFromSupabaseUser(session.user);
      this.notifyListeners();
    }

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

  private async createAppUserFromSupabaseUser(supabaseUser: SupabaseUser): Promise<User> {
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
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        auth_provider: 'google',
        settings: {
          measurementSystem: 'metric',
          notifications: true,
          privacyLevel: 'private'
        }
      };

      const { error } = await supabase.from('users').insert([newProfile]);
      if (error) throw error;

      return mapSupabaseUser(supabaseUser);
    }

    return mapSupabaseUser(supabaseUser);
  }

  public static getInstance(): AuthService {
    if (!AuthService.instance) {
      AuthService.instance = new AuthService();
    }
    return AuthService.instance;
  }

  public async signInWithGoogle(idToken: string): Promise<void> {
    try {
      const { data, error } = await supabase.auth.signInWithIdToken({
        provider: 'google',
        token: idToken,
        nonce: undefined, // Let Supabase handle the nonce
      });

      if (error) throw error;
      
      if (data.user) {
        this.currentUser = await this.createAppUserFromSupabaseUser(data.user);
        this.notifyListeners();
      } else {
        throw new Error('No user data returned from authentication');
      }
    } catch (error) {
      console.error('Supabase auth error:', error);
      throw error;
    }
  }

  public async signOut(): Promise<void> {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
    this.currentUser = null;
    this.notifyListeners();
    await AsyncStorage.clear();
  }

  public getCurrentUser(): User | null {
    return this.currentUser;
  }

  public addAuthStateListener(listener: (user: User | null) => void): () => void {
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
