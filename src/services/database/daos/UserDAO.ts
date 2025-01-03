import { BaseDAO } from '../BaseDAO';
import { Logger } from '../../../utils/error/Logger';

export interface User {
  id: string;
  email: string;
  full_name: string;
  avatar_url?: string;
  created_at: string;
  updated_at: string;
  last_sign_in_at?: string;
  preferences?: UserPreferences;
  profile?: UserProfile;
}

interface UserPreferences {
  notifications: {
    email: boolean;
    push: boolean;
  };
  theme: 'light' | 'dark' | 'system';
  privacySettings: {
    shareHealthData: boolean;
    showInLeaderboard: boolean;
  };
}

interface UserProfile {
  bio?: string;
  location?: string;
  timezone?: string;
  goals?: {
    daily_steps?: number;
    daily_activity_minutes?: number;
    weekly_workouts?: number;
  };
}

export class UserDAO extends BaseDAO<User> {
  protected tableName = 'users';

  /**
   * Finds a user by email
   */
  public async findByEmail(email: string): Promise<User | null> {
    try {
      const { data: user, error } = await this.supabase
        .from(this.tableName)
        .select()
        .eq('email', email.toLowerCase())
        .single();

      if (error) throw this.handleError(error);
      return user;
    } catch (error) {
      Logger.error('Failed to find user by email', { error, email });
      throw this.handleError(error);
    }
  }

  /**
   * Updates a user's preferences
   */
  public async updatePreferences(
    userId: string,
    preferences: Partial<UserPreferences>
  ): Promise<User> {
    try {
      // First get current preferences
      const currentUser = await this.findById(userId);
      if (!currentUser) {
        throw this.handleError(new Error('User not found'));
      }

      // Get current preferences or defaults
      const currentPreferences = currentUser.preferences || this.getDefaultPreferences();

      // Merge with new preferences, ensuring required fields
      const updatedPreferences: UserPreferences = {
        notifications: {
          email: preferences.notifications?.email ?? currentPreferences.notifications.email,
          push: preferences.notifications?.push ?? currentPreferences.notifications.push,
        },
        theme: preferences.theme ?? currentPreferences.theme,
        privacySettings: {
          shareHealthData: preferences.privacySettings?.shareHealthData ?? currentPreferences.privacySettings.shareHealthData,
          showInLeaderboard: preferences.privacySettings?.showInLeaderboard ?? currentPreferences.privacySettings.showInLeaderboard,
        },
      };

      // Update user
      return await this.update(userId, { 
        preferences: updatedPreferences,
        updated_at: new Date().toISOString(),
      });
    } catch (error) {
      Logger.error('Failed to update user preferences', { error, userId, preferences });
      throw this.handleError(error);
    }
  }

  /**
   * Updates a user's profile
   */
  public async updateProfile(
    userId: string,
    profile: Partial<UserProfile>
  ): Promise<User> {
    try {
      // First get current profile
      const currentUser = await this.findById(userId);
      if (!currentUser) {
        throw this.handleError(new Error('User not found'));
      }

      // Merge with new profile data
      const updatedProfile = {
        ...currentUser.profile,
        ...profile,
      };

      // Update user
      return await this.update(userId, { 
        profile: updatedProfile,
        updated_at: new Date().toISOString(),
      });
    } catch (error) {
      Logger.error('Failed to update user profile', { error, userId, profile });
      throw this.handleError(error);
    }
  }

  /**
   * Updates a user's avatar
   */
  public async updateAvatar(userId: string, avatarUrl: string): Promise<User> {
    try {
      return await this.update(userId, { 
        avatar_url: avatarUrl,
        updated_at: new Date().toISOString(),
      });
    } catch (error) {
      Logger.error('Failed to update user avatar', { error, userId, avatarUrl });
      throw this.handleError(error);
    }
  }

  /**
   * Updates last sign in timestamp
   */
  public async updateLastSignIn(userId: string): Promise<void> {
    try {
      await this.update(userId, {
        last_sign_in_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });
    } catch (error) {
      Logger.error('Failed to update last sign in', { error, userId });
      throw this.handleError(error);
    }
  }

  /**
   * Gets users for leaderboard
   */
  public async getLeaderboardUsers(limit: number = 10): Promise<User[]> {
    try {
      const { data: users, error } = await this.supabase
        .from(this.tableName)
        .select(`
          id,
          email,
          full_name,
          avatar_url,
          created_at,
          updated_at,
          last_sign_in_at,
          preferences,
          profile
        `)
        .eq('preferences->privacySettings->showInLeaderboard', true)
        .order('profile->goals->daily_steps', { ascending: false })
        .limit(limit);

      if (error) throw this.handleError(error);
      return users;
    } catch (error) {
      Logger.error('Failed to get leaderboard users', { error, limit });
      throw this.handleError(error);
    }
  }

  /**
   * Gets default user preferences
   */
  private getDefaultPreferences(): UserPreferences {
    return {
      notifications: {
        email: true,
        push: true,
      },
      theme: 'system',
      privacySettings: {
        shareHealthData: false,
        showInLeaderboard: false,
      },
    };
  }

  /**
   * Gets default user profile
   */
  private getDefaultProfile(): UserProfile {
    return {
      goals: {
        daily_steps: 10000,
        daily_activity_minutes: 30,
        weekly_workouts: 3,
      },
    };
  }

  /**
   * Override create to add default preferences and profile
   */
  public async create(data: Partial<User>): Promise<User> {
    const userData = {
      ...data,
      email: data.email?.toLowerCase(),
      preferences: this.getDefaultPreferences(),
      profile: this.getDefaultProfile(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    return super.create(userData);
  }
}

// Export singleton instance
export const userDAO = new UserDAO();
