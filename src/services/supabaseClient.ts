import { createClient } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';
import 'react-native-url-polyfill/auto';

const supabaseConfig = Constants.expoConfig?.extra?.supabase;
if (!supabaseConfig?.url || !supabaseConfig?.anonKey) {
  throw new Error('Missing Supabase configuration. Please check your app.config.js and .env file.');
}

export const supabase = createClient(supabaseConfig.url, supabaseConfig.anonKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});
