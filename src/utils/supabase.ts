import 'react-native-url-polyfill/auto'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { createClient } from '@supabase/supabase-js'
import Constants from 'expo-constants'

// Try to get config from Constants first, then fall back to env vars
const supabaseUrl = Constants.expoConfig?.extra?.supabase?.url || process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = Constants.expoConfig?.extra?.supabase?.anonKey || process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

// Debug logging
console.log('Supabase Configuration Sources:', {
  constantsUrl: Constants.expoConfig?.extra?.supabase?.url ? 'Set' : 'Missing',
  constantsAnonKey: Constants.expoConfig?.extra?.supabase?.anonKey ? 'Set' : 'Missing',
  envUrl: process.env.EXPO_PUBLIC_SUPABASE_URL ? 'Set' : 'Missing',
  envAnonKey: process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ? 'Set' : 'Missing',
  finalUrl: supabaseUrl ? 'Set' : 'Missing',
  finalAnonKey: supabaseAnonKey ? 'Set' : 'Missing'
});

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    'Missing Supabase configuration. Ensure EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_ANON_KEY are set in your .env file.'
  );
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
  db: {
    schema: 'public'
  }
});
