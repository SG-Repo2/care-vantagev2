import { User } from '@supabase/supabase-js';
import { supabase } from '../../../utils/supabase';
import { CreateProfileParams, ProfileService, UpdateProfileParams, UserProfile } from '../types/profile.types';

class ProfileServiceImpl implements ProfileService {
  async createProfile(user: User): Promise<UserProfile> {
    const profileData: CreateProfileParams = {
      id: user.id,
      email: user.email || '',
      display_name: user.user_metadata?.full_name,
    };

    const { data, error } = await supabase
      .from('users')
      .insert([profileData])
      .select()
      .single();

    if (error) {
      console.error('Error creating profile:', error);
      throw error;
    }

    return data;
  }

  async getProfile(userId: string): Promise<UserProfile | null> {
    const { data, error } = await supabase
      .from('users')
      .select()
      .eq('id', userId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return null;
      }
      console.error('Error getting profile:', error);
      throw error;
    }

    return data;
  }

  async updateProfile(userId: string, params: UpdateProfileParams): Promise<UserProfile> {
    const { data, error } = await supabase
      .from('users')
      .update({
        ...params,
        updated_at: new Date().toISOString(),
      })
      .eq('id', userId)
      .select()
      .single();

    if (error) {
      console.error('Error updating profile:', error);
      throw error;
    }

    return data;
  }

  async validateUserAccess(userId: string): Promise<void> {
    const profile = await this.getProfile(userId);
    
    if (!profile) {
      throw new Error('Profile not found');
    }

    if (profile.deleted_at) {
      throw new Error('Profile has been deleted');
    }
  }
}

export const profileService = new ProfileServiceImpl();
