import { supabase } from '@utils/supabase';
import { Logger } from '@utils/error/Logger';
import { AuthError } from '../errors/AuthErrors';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';

interface MFAState {
  isEnabled: boolean;
  preferredMethod: 'totp' | 'sms' | null;
  backupCodes?: string[];
}

export class MFAService {
  private static instance: MFAService;
  private readonly storageKey = '@mfa_state';
  private readonly secretKey = 'mfa_secret';

  private constructor() {}

  public static getInstance(): MFAService {
    if (!MFAService.instance) {
      MFAService.instance = new MFAService();
    }
    return MFAService.instance;
  }

  /**
   * Enable TOTP (Time-based One-Time Password) authentication
   */
  public async enableTOTP(): Promise<{ secret: string; uri: string }> {
    try {
      const { data, error } = await supabase.auth.mfa.enroll({
        factorType: 'totp',
        issuer: 'CareVantage',
        friendlyName: 'CareVantage Mobile App'
      });

      if (error) throw error;
      if (!data?.totp?.secret) {
        throw new Error('Invalid MFA enrollment response');
      }

      // Store MFA state
      await this.setMFAState({
        isEnabled: true,
        preferredMethod: 'totp'
      });

      // Securely store the secret
      await SecureStore.setItemAsync(this.secretKey, data.totp.secret);

      return {
        secret: data.totp.secret,
        uri: data.totp.uri
      };
    } catch (error) {
      Logger.error('Failed to enable TOTP', { error });
      throw new AuthError(
        'Failed to enable two-factor authentication',
        'AUTH_MFA_ENABLE_FAILED',
        { originalError: error }
      );
    }
  }

  /**
   * Challenge TOTP verification
   */
  private async challengeTOTP(): Promise<string> {
    try {
      const { data, error } = await supabase.auth.mfa.challenge({
        factorId: 'totp'
      });

      if (error) throw error;
      if (!data?.id) {
        throw new Error('Failed to create MFA challenge');
      }

      return data.id;
    } catch (error) {
      Logger.error('Failed to create MFA challenge', { error });
      throw new AuthError(
        'Failed to initiate verification',
        'AUTH_MFA_CHALLENGE_FAILED',
        { originalError: error }
      );
    }
  }

  /**
   * Verify TOTP code
   */
  public async verifyTOTP(code: string): Promise<boolean> {
    try {
      // First create a challenge
      const challengeId = await this.challengeTOTP();

      // Then verify the code
      const { data, error } = await supabase.auth.mfa.verify({
        factorId: 'totp',
        challengeId,
        code
      });

      if (error) throw error;
      return data.access_token !== undefined;
    } catch (error) {
      Logger.error('Failed to verify TOTP', { error });
      throw new AuthError(
        'Failed to verify authentication code',
        'AUTH_MFA_VERIFY_FAILED',
        { originalError: error }
      );
    }
  }

  /**
   * Get backup codes
   * Note: Recovery codes are generated during MFA enrollment
   */
  public async getBackupCodes(): Promise<string[]> {
    try {
      const state = await this.getMFAState();
      if (!state.backupCodes || state.backupCodes.length === 0) {
        throw new Error('No backup codes available. Please re-enroll in MFA to generate new codes.');
      }
      return state.backupCodes;
    } catch (error) {
      Logger.error('Failed to generate backup codes', { error });
      throw new AuthError(
        'Failed to generate backup codes',
        'AUTH_MFA_BACKUP_FAILED',
        { originalError: error }
      );
    }
  }

  /**
   * Disable MFA
   */
  public async disableMFA(): Promise<void> {
    try {
      const { error } = await supabase.auth.mfa.unenroll({
        factorId: 'totp'
      });

      if (error) throw error;

      // Clear MFA state and secret
      await this.clearMFAState();
      await SecureStore.deleteItemAsync(this.secretKey);

      Logger.info('MFA disabled successfully');
    } catch (error) {
      Logger.error('Failed to disable MFA', { error });
      throw new AuthError(
        'Failed to disable two-factor authentication',
        'AUTH_MFA_DISABLE_FAILED',
        { originalError: error }
      );
    }
  }

  /**
   * Check if MFA is enabled
   */
  public async isMFAEnabled(): Promise<boolean> {
    try {
      const state = await this.getMFAState();
      return state.isEnabled;
    } catch (error) {
      Logger.error('Failed to check MFA status', { error });
      return false;
    }
  }

  /**
   * Get current MFA method
   */
  public async getMFAMethod(): Promise<'totp' | 'sms' | null> {
    try {
      const state = await this.getMFAState();
      return state.preferredMethod;
    } catch (error) {
      Logger.error('Failed to get MFA method', { error });
      return null;
    }
  }

  private async setMFAState(state: MFAState): Promise<void> {
    try {
      await AsyncStorage.setItem(this.storageKey, JSON.stringify(state));
    } catch (error) {
      Logger.error('Failed to store MFA state', { error });
    }
  }

  private async getMFAState(): Promise<MFAState> {
    try {
      const state = await AsyncStorage.getItem(this.storageKey);
      return state ? JSON.parse(state) : { isEnabled: false, preferredMethod: null };
    } catch (error) {
      Logger.error('Failed to get MFA state', { error });
      return { isEnabled: false, preferredMethod: null };
    }
  }

  private async clearMFAState(): Promise<void> {
    try {
      await AsyncStorage.removeItem(this.storageKey);
    } catch (error) {
      Logger.error('Failed to clear MFA state', { error });
    }
  }
}

// Export singleton instance
export const mfaService = MFAService.getInstance();
