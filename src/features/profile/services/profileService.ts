import { User } from '@supabase/supabase-js';
import { supabase } from '../../../utils/supabase';
import { Platform } from 'react-native';
import { UserProfile, UserProfileUpdate, HealthMetricsUpdate } from '../types/profile';
import { BaseHealthMetrics } from '../../../health-metrics/types';
import { scoreService } from '../../../health-metrics/services/ScoreService';

type UserIdInput = string | User | { id: string; email?: string };

class ProfileService {
  async validateSession(): Promise<User> {
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    if (sessionError || !session?.user) {
      throw new Error('No valid session found. Please sign in again.');
    }
    return session.user;
  }

  async signOut(): Promise<void> {
    try {
      // First clear all local state
      await this.clearLocalState();
      
      // Then sign out from Supabase
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      
    } catch (err) {
      console.error('Error signing out:', err);
      throw err;
    }
  }

  private async clearLocalState(): Promise<void> {
    try {
      // Clear Supabase session
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      
      // Clear any profile-related storage
      // Add any additional cleanup needed
      localStorage.removeItem('supabase.auth.token');
      
    } catch (err) {
      console.error('Error clearing local state:', err);
      throw err;
    }
  }

  private async waitForAuthRecord(userId: string): Promise<void> {
    const maxAttempts = 5;
    const baseDelay = 1000;

    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      try {
        // First check if the auth session exists
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
          throw new Error('No valid session found');
        }

        // Then verify the user record exists in the database
        const { data, error } = await supabase
          .from('users')
          .select('id')
          .eq('id', userId)
          .maybeSingle();
          
        if (!error && data) {
          return; // Both auth and user record exist
        }
        
        console.log(`Waiting for auth record, attempt ${attempt + 1} of ${maxAttempts}`);
        await new Promise(resolve => setTimeout(resolve, baseDelay * Math.pow(2, attempt)));
      } catch (err) {
        console.error(`Error checking auth record (attempt ${attempt + 1}):`, err);
        if (attempt === maxAttempts - 1) throw err;
      }
    }
    
    throw new Error('Auth record not found after maximum attempts');
  }

  private getUserId(input: UserIdInput): string {
    if (typeof input === 'string') return input;
    if ('id' in input) return input.id;
    throw new Error('Invalid user ID input');
  }

  async getProfile(userId: UserIdInput): Promise<UserProfile | null> {
    try {
      // Validate session first
      await this.validateSession();

      const id = this.getUserId(userId);
      if (!id) {
        throw new Error('Invalid user ID provided');
      }

      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', id)
        .maybeSingle();

      if (error) {
        if (error.code === 'PGRST116') {
          return null;
        }
        console.error('Error getting profile:', error);
        throw error;
      }

      return data;
    } catch (err) {
      console.error('Error in getProfile:', err);
      throw err;
    }
  }

  async createProfile(userId: UserIdInput, email?: string): Promise<UserProfile> {
    try {
      // First verify the session is valid
      const sessionUser = await this.validateSession();
      const id = this.getUserId(userId);

      if (!id) {
        throw new Error('Invalid user ID provided');
      }

      // Get email from input or session
      const userEmail = email ||
        (typeof userId === 'object' && 'email' in userId ? userId.email : undefined) ||
        sessionUser.email;
      
      if (!userEmail) {
        throw new Error('Email is required for profile creation');
      }

      // Wait for auth record to exist
      await this.waitForAuthRecord(id);

      const timestamp = new Date().toISOString();
      
      // Try to get existing profile first
      const { data: existingProfile, error: profileError } = await supabase
        .from('users')
        .select('*')
        .eq('id', id)
        .maybeSingle();

      if (profileError && profileError.code !== 'PGRST116') {
        console.error('Error checking existing profile:', profileError);
        throw profileError;
      }

      if (existingProfile && !existingProfile.deleted_at) {
        return existingProfile;
      }

      // Prepare profile data
      const profileData = {
        id,
        email: userEmail,
        display_name: null,
        photo_url: null,
        score: 0,
        permissions_granted: false,
        created_at: timestamp,
        updated_at: timestamp,
        last_health_sync: null,
        last_error: null
      };

      // Create profile with upsert and handle potential errors
      const { data, error } = await supabase
        .from('users')
        .upsert([profileData])
        .select()
        .maybeSingle();

      if (error) {
        console.error('Error creating profile:', error);
        if (error.code === 'PGRST116') {
          throw new Error('Failed to create profile: Database synchronization issue');
        }
        throw error;
      }

      if (!data) {
        throw new Error('Failed to create profile: No data returned');
      }

      return data;
    } catch (err) {
      console.error('Error in createProfile:', err);
      throw err;
    }
  }

  async updateProfile(userId: string, updates: UserProfileUpdate): Promise<UserProfile> {
    const { data, error } = await supabase
      .from('users')
      .update({
        ...updates,
        updated_at: new Date().toISOString()
      })
      .eq('id', userId)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async updateScore(userId: string, newScore: number): Promise<void> {
    const { error } = await supabase
      .from('users')
      .update({
        score: newScore,
        updated_at: new Date().toISOString()
      })
      .eq('id', userId);

    if (error) throw error;
  }

  async uploadProfilePhoto(userId: string, photoUri: string): Promise<string> {
    const photoPath = `public/profile_photos/${userId}`;
    const photoFile = await fetch(photoUri);
    const photoBlob = await photoFile.blob();

    const { error: uploadError } = await supabase.storage
      .from('avatars')
      .upload(photoPath, photoBlob, {
        upsert: true,
        contentType: 'image/jpeg'
      });

    if (uploadError) throw uploadError;

    const { data: { publicUrl } } = supabase.storage
      .from('avatars')
      .getPublicUrl(photoPath);

    await this.updateProfile(userId, { photo_url: publicUrl });
    return publicUrl;
  }

  async updateHealthMetrics(userId: string, metrics: HealthMetricsUpdate): Promise<void> {
    // First validate user exists
    const profile = await this.getProfile(userId);
    if (!profile) {
      throw new Error('Cannot update health metrics: User profile does not exist');
    }

    const timestamp = new Date().toISOString();

    // Use ScoreService to handle the update with proper score calculation
    const { success, score } = await scoreService.updateHealthMetrics(
      userId,
      metrics as BaseHealthMetrics,
      metrics.date
    );

    if (!success) {
      throw new Error('Failed to update health metrics');
    }

    // Update sync time on success
    await this.updateProfile(userId, {
      last_health_sync: timestamp
    });
  }
}

export const profileService = new ProfileService();
