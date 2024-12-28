import { createClient } from '@supabase/supabase-js';
import Constants from 'expo-constants';
import AsyncStorage from '@react-native-async-storage/async-storage';
import 'react-native-url-polyfill/auto';

const supabaseUrl = Constants.expoConfig?.extra?.supabase?.url;
const supabaseAnonKey = Constants.expoConfig?.extra?.supabase?.anonKey;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase configuration. Please check your app.config.js and .env file.');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: {
      async getItem(key: string) {
        try {
          return await AsyncStorage.getItem(key);
        } catch (error) {
          console.error('Error getting item:', error);
          return null;
        }
      },
      async setItem(key: string, value: string) {
        try {
          await AsyncStorage.setItem(key, value);
        } catch (error) {
          console.error('Error setting item:', error);
        }
      },
      async removeItem(key: string) {
        try {
          await AsyncStorage.removeItem(key);
        } catch (error) {
          console.error('Error removing item:', error);
        }
      },
    },
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});
