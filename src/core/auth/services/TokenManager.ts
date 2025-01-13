import { Logger } from '../../../utils/error/Logger';
import { TokenRefreshError } from '../errors/AuthErrors';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '../../../utils/supabase';
import * as jose from 'jose';
import * as Crypto from 'expo-crypto';

interface TokenMetadata {
  issuedAt: number;
  expiresAt: number;
  tokenType: string;
  scope?: string[];
}

export class TokenManager {
  private static instance: TokenManager;
  private readonly storageKeys = {
    tokenBlacklist: '@token_blacklist',
  };

  private constructor() {}

  public static getInstance(): TokenManager {
    if (!TokenManager.instance) {
      TokenManager.instance = new TokenManager();
    }
    return TokenManager.instance;
  }

  /**
   * Validates a JWT token's structure and signature
   */
  public async validateToken(token: string): Promise<boolean> {
    try {
      // Decode the token without verifying to check structure
      const decoded = jose.decodeJwt(token);
      
      if (!decoded || !decoded.exp || !decoded.iat || !decoded.sub) {
        Logger.warn('Invalid token structure', { decoded });
        return false;
      }

      // Check if token is expired
      const now = Math.floor(Date.now() / 1000);
      if (decoded.exp < now) {
        Logger.warn('Token is expired', {
          expiry: new Date(decoded.exp * 1000).toISOString()
        });
        return false;
      }

      // Check if token is blacklisted
      const isBlacklisted = await this.isTokenBlacklisted(token);
      if (isBlacklisted) {
        Logger.warn('Token is blacklisted');
        return false;
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
          return false;
        }
      } catch (error) {
        Logger.error('Error verifying user existence', { error });
        return false;
      }

      return true;
    } catch (error) {
      Logger.error('Token validation failed', { error });
      return false;
    }
  }

  /**
   * Extracts and returns metadata from a JWT token
   */
  public async getTokenMetadata(token: string): Promise<TokenMetadata | null> {
    try {
      const decoded = jose.decodeJwt(token);
      
      if (!decoded || !decoded.exp || !decoded.iat) {
        return null;
      }

      return {
        issuedAt: decoded.iat * 1000, // Convert to milliseconds
        expiresAt: decoded.exp * 1000,
        tokenType: decoded.typ as string || 'Bearer',
        scope: decoded.scope as string[] || undefined,
      };
    } catch (error) {
      Logger.error('Failed to extract token metadata', { error });
      return null;
    }
  }

  /**
   * Revokes a token by adding it to the blacklist
   */
  public async revokeToken(token: string): Promise<void> {
    try {
      // Add to local blacklist
      await this.addToBlacklist(token);

      // Revoke on Supabase
      const { error } = await supabase.auth.signOut();
      if (error) throw error;

      Logger.info('Token revoked successfully');
    } catch (error) {
      Logger.error('Failed to revoke token', { error });
      throw new TokenRefreshError({ originalError: error });
    }
  }

  /**
   * Checks if a token is blacklisted
   */
  private async isTokenBlacklisted(token: string): Promise<boolean> {
    try {
      const blacklistJson = await AsyncStorage.getItem(this.storageKeys.tokenBlacklist);
      if (!blacklistJson) return false;

      const blacklist: Record<string, number> = JSON.parse(blacklistJson);
      const hashedToken = await this.hashToken(token);
      return !!blacklist[hashedToken];
    } catch (error) {
      Logger.error('Failed to check token blacklist', { error });
      return false;
    }
  }

  /**
   * Adds a token to the blacklist
   */
  private async addToBlacklist(token: string): Promise<void> {
    try {
      const metadata = await this.getTokenMetadata(token);
      if (!metadata) {
        throw new Error('Could not extract token metadata');
      }

      const blacklistJson = await AsyncStorage.getItem(this.storageKeys.tokenBlacklist);
      const blacklist: Record<string, number> = blacklistJson 
        ? JSON.parse(blacklistJson)
        : {};

      // Store expiration time with hashed token
      const hashedToken = await this.hashToken(token);
      blacklist[hashedToken] = metadata.expiresAt;

      // Clean up expired entries
      const now = Date.now();
      for (const [hash, expiry] of Object.entries(blacklist)) {
        if (expiry < now) {
          delete blacklist[hash];
        }
      }

      await AsyncStorage.setItem(
        this.storageKeys.tokenBlacklist,
        JSON.stringify(blacklist)
      );
    } catch (error) {
      Logger.error('Failed to add token to blacklist', { error });
      throw error;
    }
  }

  /**
   * Creates a cryptographic hash of the token for storage
   */
  private async hashToken(token: string): Promise<string> {
    const data = new TextEncoder().encode(token);
    const hash = await Crypto.digest(
      Crypto.CryptoDigestAlgorithm.SHA256,
      data
    );
    return Buffer.from(hash).toString('base64');
  }

  /**
   * Cleans up expired tokens from the blacklist
   */
  public async cleanupBlacklist(): Promise<void> {
    try {
      const blacklistJson = await AsyncStorage.getItem(this.storageKeys.tokenBlacklist);
      if (!blacklistJson) return;

      const blacklist: Record<string, number> = JSON.parse(blacklistJson);
      const now = Date.now();
      let hasChanges = false;

      for (const [hash, expiry] of Object.entries(blacklist)) {
        if (expiry < now) {
          delete blacklist[hash];
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

// Export a singleton instance
export const tokenManager = TokenManager.getInstance();
