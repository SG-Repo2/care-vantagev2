import { Logger } from '@utils/error/Logger';
import { supabase } from '@utils/supabase';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { TokenMetadata, TokenValidationResult, StorageKeys } from './types';

export class TokenValidator {
  private readonly storageKeys: StorageKeys;

  constructor(storageKeys: StorageKeys) {
    this.storageKeys = storageKeys;
  }

  private base64Decode(str: string): string {
    const base64 = str.replace(/-/g, '+').replace(/_/g, '/');
    try {
      return decodeURIComponent(
        atob(base64)
          .split('')
          .map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
          .join('')
      );
    } catch {
      return atob(base64);
    }
  }

  private decodeJwtHeader(token: string): any {
    try {
      const parts = token.split('.');
      if (parts.length !== 3) return null;
      return JSON.parse(this.base64Decode(parts[0]));
    } catch {
      return null;
    }
  }

  private decodeJwtPayload(token: string): any {
    try {
      const parts = token.split('.');
      if (parts.length !== 3) {
        throw new Error('Invalid JWT format');
      }
      const payload = parts[1];
      return JSON.parse(this.base64Decode(payload));
    } catch (error) {
      Logger.error('Failed to decode JWT payload', { error });
      return null;
    }
  }

  public async validateToken(token: string): Promise<TokenValidationResult> {
    try {
      // Decode the token without verifying to check structure
      const header = this.decodeJwtHeader(token);
      const decoded = this.decodeJwtPayload(token);
      
      if (!decoded || !decoded.exp || !decoded.iat || !decoded.sub || !header) {
        Logger.warn('Invalid token structure', { decoded, header });
        return { isValid: false, error: 'Invalid token structure' };
      }

      // Check if token is expired
      const now = Math.floor(Date.now() / 1000);
      if (decoded.exp < now) {
        Logger.warn('Token is expired', {
          expiry: new Date(decoded.exp * 1000).toISOString()
        });
        return { isValid: false, error: 'Token expired' };
      }

      // Check if token is blacklisted
      const isBlacklisted = await this.isTokenBlacklisted(token);
      if (isBlacklisted) {
        Logger.warn('Token is blacklisted');
        return { isValid: false, error: 'Token is blacklisted' };
      }

      // Verify the user exists in the database
      try {
        const { data: user, error } = await supabase
          .from('users')
          .select('id')
          .eq('id', decoded.sub)
          .single();

        if (error || !user) {
          Logger.warn('User from token does not exist in database', {
            userId: decoded.sub,
            error
          });
          // Add token to blacklist since it references a non-existent user
          await this.addToBlacklist(token);
          return { isValid: false, error: 'User does not exist' };
        }
      } catch (error) {
        Logger.error('Error verifying user existence', { error });
        return { isValid: false, error: 'Failed to verify user' };
      }

      const metadata = await this.extractTokenMetadata(token);
      return { isValid: true, metadata };
    } catch (error) {
      Logger.error('Token validation failed', { error });
      return { isValid: false, error: 'Token validation failed' };
    }
  }

  public async extractTokenMetadata(token: string): Promise<TokenMetadata | undefined> {
    try {
      const header = this.decodeJwtHeader(token);
      const decoded = this.decodeJwtPayload(token);
      
      if (!decoded || !decoded.exp || !decoded.iat || !header) {
        return undefined;
      }

      return {
        issuedAt: decoded.iat * 1000, // Convert to milliseconds
        expiresAt: decoded.exp * 1000,
        tokenType: decoded.typ as string || 'Bearer',
        scope: decoded.scope as string[] || undefined,
        sub: decoded.sub,
        email: decoded.email as string,
        role: decoded.role as string,
      };
    } catch (error) {
      Logger.error('Failed to extract token metadata', { error });
      return undefined;
    }
  }

  public async isTokenBlacklisted(token: string): Promise<boolean> {
    try {
      const blacklistJson = await AsyncStorage.getItem(this.storageKeys.tokenBlacklist);
      if (!blacklistJson) return false;

      const blacklist: Record<string, number> = JSON.parse(blacklistJson);
      // Use last 32 chars of token as key since tokens are already unique
      const tokenKey = token.slice(-32);
      return !!blacklist[tokenKey];
    } catch (error) {
      Logger.error('Failed to check token blacklist', { error });
      return false;
    }
  }

  public async addToBlacklist(token: string): Promise<void> {
    try {
      const metadata = await this.extractTokenMetadata(token);
      if (!metadata) {
        throw new Error('Could not extract token metadata');
      }

      const blacklistJson = await AsyncStorage.getItem(this.storageKeys.tokenBlacklist);
      const blacklist: Record<string, number> = blacklistJson
        ? JSON.parse(blacklistJson)
        : {};

      // Use last 32 chars of token as key since tokens are already unique
      const tokenKey = token.slice(-32);
      blacklist[tokenKey] = metadata.expiresAt;

      await AsyncStorage.setItem(
        this.storageKeys.tokenBlacklist,
        JSON.stringify(blacklist)
      );
    } catch (error) {
      Logger.error('Failed to add token to blacklist', { error });
      throw error;
    }
  }

  public async cleanupBlacklist(): Promise<void> {
    try {
      const blacklistJson = await AsyncStorage.getItem(this.storageKeys.tokenBlacklist);
      if (!blacklistJson) return;

      const blacklist: Record<string, number> = JSON.parse(blacklistJson);
      const now = Date.now();
      let hasChanges = false;

      for (const [key, expiry] of Object.entries(blacklist)) {
        if (expiry < now) {
          delete blacklist[key];
          hasChanges = true;
        }
      }

      if (hasChanges) {
        await AsyncStorage.setItem(
          this.storageKeys.tokenBlacklist,
          JSON.stringify(blacklist)
        );
        Logger.info('Token blacklist cleaned up');
      }
    } catch (error) {
      Logger.error('Failed to cleanup token blacklist', { error });
    }
  }
}