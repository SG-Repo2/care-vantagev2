import 'react-native-url-polyfill/auto'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { createClient, SupabaseClient } from '@supabase/supabase-js'
import Constants from 'expo-constants'
import { Platform } from 'react-native'

// Define types for Supabase configuration
interface SupabaseConfig {
  url: string;
  anonKey: string;
}

// Define types for environment configuration
interface AppConfig {
  supabase: SupabaseConfig;
  googleAuth: {
    iosClientId?: string;
    androidClientId?: string;
    webClientId?: string;
  };
}

// Get platform-specific configuration
const getConfig = (): AppConfig => {
  const config = Constants.expoConfig?.extra as AppConfig | undefined;
  
  if (!config) {
    throw new Error('Missing application configuration');
  }

  // Validate Supabase configuration
  if (!config.supabase?.url || !config.supabase?.anonKey) {
    throw new Error(
      'Missing Supabase configuration. Ensure EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_ANON_KEY are set.'
    );
  }

  // Validate Google Auth configuration based on platform
  if (Platform.OS === 'ios' && !config.googleAuth?.iosClientId) {
    throw new Error('Missing Google iOS client ID');
  }
  if (Platform.OS === 'android' && !config.googleAuth?.androidClientId) {
    throw new Error('Missing Google Android client ID');
  }

  return config;
};

// Create and configure Supabase client
const createSupabaseClient = (): SupabaseClient => {
  try {
    const config = getConfig();
    
    return createClient(config.supabase.url, config.supabase.anonKey, {
      auth: {
        storage: AsyncStorage,
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: false,
      },
      db: {
        schema: 'public'
      },
      // Add request error handling
      global: {
        headers: {
          'X-Client-Platform': Platform.OS,
          'X-Client-Version': Constants.expoConfig?.version || '1.0.0',
        },
      },
    });
  } catch (error) {
    console.error('Failed to initialize Supabase client:', error);
    throw error;
  }
};

// Export singleton instance
export const supabase = createSupabaseClient();

// Export helper to check auth status
export const isAuthenticated = async (): Promise<boolean> => {
  try {
    const { data: { session }, error } = await supabase.auth.getSession();
    if (error) throw error;
    return !!session;
  } catch (error) {
    console.error('Error checking auth status:', error);
    return false;
  }
};

// Export helper for handling auth errors
export const getAuthErrorMessage = (error: unknown): string => {
  if (error instanceof Error) {
    // Handle specific Supabase error cases
    if (error.message.includes('Email not confirmed')) {
      return 'Please verify your email address';
    }
    if (error.message.includes('Invalid login credentials')) {
      return 'Invalid email or password';
    }
    return error.message;
  }
  return 'An unexpected error occurred';
};
