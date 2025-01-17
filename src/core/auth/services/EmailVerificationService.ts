import { supabase } from '@utils/supabase';
import { Logger } from '@utils/error/Logger';
import { AuthError } from '../errors/AuthErrors';
import AsyncStorage from '@react-native-async-storage/async-storage';

export class EmailVerificationService {
  private static instance: EmailVerificationService;
  private readonly storageKey = '@email_verification_state';

  private constructor() {}

  public static getInstance(): EmailVerificationService {
    if (!EmailVerificationService.instance) {
      EmailVerificationService.instance = new EmailVerificationService();
    }
    return EmailVerificationService.instance;
  }

  /**
   * Send verification email
   */
  public async sendVerificationEmail(email: string): Promise<void> {
    try {
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          shouldCreateUser: false,
        },
      });

      if (error) throw error;

      // Store verification state
      await this.setVerificationState(email);
      Logger.info('Verification email sent', { email });
    } catch (error) {
      Logger.error('Failed to send verification email', { error, email });
      throw new AuthError(
        'Failed to send verification email',
        'AUTH_VERIFICATION_EMAIL_FAILED',
        { originalError: error }
      );
    }
  }

  /**
   * Verify email with token
   */
  public async verifyEmail(email: string, token: string): Promise<void> {
    try {
      const { error } = await supabase.auth.verifyOtp({
        email,
        token,
        type: 'email',
      });

      if (error) throw error;

      // Clear verification state
      await this.clearVerificationState();
      Logger.info('Email verified successfully');
    } catch (error) {
      Logger.error('Failed to verify email', { error });
      throw new AuthError(
        'Failed to verify email',
        'AUTH_VERIFY_EMAIL_FAILED',
        { originalError: error }
      );
    }
  }

  /**
   * Check if email is verified
   */
  public async isEmailVerified(): Promise<boolean> {
    try {
      const { data: { user }, error } = await supabase.auth.getUser();
      if (error) throw error;
      return user?.email_confirmed_at != null;
    } catch (error) {
      Logger.error('Failed to check email verification status', { error });
      return false;
    }
  }

  private async setVerificationState(email: string): Promise<void> {
    try {
      await AsyncStorage.setItem(this.storageKey, JSON.stringify({
        email,
        timestamp: Date.now()
      }));
    } catch (error) {
      Logger.error('Failed to store verification state', { error });
    }
  }

  private async clearVerificationState(): Promise<void> {
    try {
      await AsyncStorage.removeItem(this.storageKey);
    } catch (error) {
      Logger.error('Failed to clear verification state', { error });
    }
  }
}

// Export singleton instance
export const emailVerificationService = EmailVerificationService.getInstance();
