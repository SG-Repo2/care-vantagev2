import 'react-native-url-polyfill/auto'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { createClient } from '@supabase/supabase-js'
import Constants from 'expo-constants'

const supabaseConfig = Constants.expoConfig?.extra?.supabase;

if (!supabaseConfig?.url || !supabaseConfig?.anonKey) {
  throw new Error('Missing Supabase configuration. Check your app.config.js and .env files.')
}

export const supabase = createClient(supabaseConfig.url, supabaseConfig.anonKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
})
