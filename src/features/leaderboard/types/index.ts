import type { Database } from '../../../types/supabase';

export type LeaderboardUser = Pick<
  Database['public']['Tables']['users']['Row'],
  'id' | 'display_name' | 'photo_url' | 'score'
>;