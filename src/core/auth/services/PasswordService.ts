import { supabase } from '@utils/supabase';
import { Logger } from '@utils/error/Logger';
import { AuthError } from '../errors/AuthErrors';

export class PasswordService {
  private static instance: PasswordService;

  private constructor() {}

  public static getInstance(): PasswordService {
    if (!PasswordService.instance) {
      PasswordService.instance = new PasswordService();
    }
    return PasswordService.instance;
  }

  /**
   * Send password reset email
   */
  public async sendResetEmail(email: string): Promise<void> {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: 'myapp://reset-password',
      });

      if (error) throw error;
      Logger.info('Password reset email sent', { email });
    } catch (error) {
      Logger.error('Failed to send password reset email', { error, email });
      throw new AuthError(
        'Failed to send password reset email',
        'AUTH_RESET_EMAIL_FAILED',
        { originalError: error }
      );
    }
  }

  /**
   * Reset password with token
   */
  public async resetPassword(newPassword: string): Promise<void> {
    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword
      });

      if (error) throw error;
      Logger.info('Password reset successful');
    } catch (error) {
      Logger.error('Failed to reset password', { error });
      throw new AuthError(
        'Failed to reset password',
        'AUTH_RESET_PASSWORD_FAILED',
        { originalError: error }
      );
    }
  }

  /**
   * Update password for authenticated user
   */
  public async updatePassword(
    currentPassword: string,
    newPassword: string
  ): Promise<void> {
    try {
      // First verify current password
      const { error: verifyError } = await supabase.auth.signInWithPassword({
        email: '', // Will be filled from session
        password: currentPassword,
      });

      if (verifyError) throw verifyError;

      // Update to new password
      const { error } = await supabase.auth.updateUser({
        password: newPassword
      });

      if (error) throw error;
      Logger.info('Password updated successfully');
    } catch (error) {
      Logger.error('Failed to update password', { error });
      throw new AuthError(
        'Failed to update password',
        'AUTH_UPDATE_PASSWORD_FAILED',
        { originalError: error }
      );
    }
  }
}

// Export singleton instance
export const passwordService = PasswordService.getInstance();
