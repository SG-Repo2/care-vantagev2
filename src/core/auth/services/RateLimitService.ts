import AsyncStorage from '@react-native-async-storage/async-storage';
import { Logger } from '@utils/error/Logger';
import { TooManyRequestsError } from '../errors/AuthErrors';

interface RateLimitConfig {
  maxAttempts: number;
  windowMs: number;
}

interface RateLimitEntry {
  attempts: number;
  firstAttempt: number;
  lastAttempt: number;
}

export class RateLimitService {
  private static instance: RateLimitService;
  private readonly storageKey = '@rate_limit_entries';
  
  // Default configurations for different actions
  private readonly configs: Record<string, RateLimitConfig> = {
    login: { maxAttempts: 5, windowMs: 15 * 60 * 1000 }, // 5 attempts per 15 minutes
    signup: { maxAttempts: 3, windowMs: 60 * 60 * 1000 }, // 3 attempts per hour
    passwordReset: { maxAttempts: 2, windowMs: 60 * 60 * 1000 }, // 2 attempts per hour
    verification: { maxAttempts: 3, windowMs: 30 * 60 * 1000 }, // 3 attempts per 30 minutes
    mfa: { maxAttempts: 3, windowMs: 5 * 60 * 1000 }, // 3 attempts per 5 minutes
  };

  private constructor() {
    // Start periodic cleanup
    this.startCleanupInterval();
  }

  public static getInstance(): RateLimitService {
    if (!RateLimitService.instance) {
      RateLimitService.instance = new RateLimitService();
    }
    return RateLimitService.instance;
  }

  /**
   * Check and increment rate limit for an action
   */
  public async checkRateLimit(
    action: string,
    identifier: string
  ): Promise<void> {
    try {
      const config = this.configs[action];
      if (!config) {
        Logger.warn('No rate limit config found for action', { action });
        return;
      }

      const key = this.getStorageKey(action, identifier);
      const entry = await this.getRateLimitEntry(key);

      if (this.isRateLimited(entry, config)) {
        const resetTime = new Date(entry.firstAttempt + config.windowMs);
        const remainingTime = config.windowMs - (Date.now() - entry.firstAttempt);
        
        throw new TooManyRequestsError({
          action,
          resetTime: resetTime.toISOString(),
          remainingMs: remainingTime,
          maxAttempts: config.maxAttempts
        });
      }

      await this.incrementRateLimit(key, entry);
    } catch (error) {
      if (error instanceof TooManyRequestsError) {
        throw error;
      }
      Logger.error('Rate limit check failed', { error, action, identifier });
    }
  }

  /**
   * Reset rate limit for an action
   */
  public async resetRateLimit(
    action: string,
    identifier: string
  ): Promise<void> {
    try {
      const key = this.getStorageKey(action, identifier);
      await this.removeRateLimitEntry(key);
      Logger.info('Rate limit reset', { action, identifier });
    } catch (error) {
      Logger.error('Failed to reset rate limit', { error, action, identifier });
    }
  }

  /**
   * Get remaining attempts for an action
   */
  public async getRemainingAttempts(
    action: string,
    identifier: string
  ): Promise<{ remaining: number; resetTime: Date }> {
    try {
      const config = this.configs[action];
      if (!config) {
        return { remaining: 0, resetTime: new Date() };
      }

      const key = this.getStorageKey(action, identifier);
      const entry = await this.getRateLimitEntry(key);
      const remaining = config.maxAttempts - entry.attempts;
      const resetTime = new Date(entry.firstAttempt + config.windowMs);

      return { remaining, resetTime };
    } catch (error) {
      Logger.error('Failed to get remaining attempts', { error, action, identifier });
      return { remaining: 0, resetTime: new Date() };
    }
  }

  private getStorageKey(action: string, identifier: string): string {
    return `${this.storageKey}:${action}:${identifier}`;
  }

  private async getRateLimitEntry(key: string): Promise<RateLimitEntry> {
    try {
      const stored = await AsyncStorage.getItem(key);
      if (stored) {
        return JSON.parse(stored);
      }
      return {
        attempts: 0,
        firstAttempt: Date.now(),
        lastAttempt: Date.now()
      };
    } catch (error) {
      Logger.error('Failed to get rate limit entry', { error, key });
      return {
        attempts: 0,
        firstAttempt: Date.now(),
        lastAttempt: Date.now()
      };
    }
  }

  private async incrementRateLimit(
    key: string,
    entry: RateLimitEntry
  ): Promise<void> {
    try {
      const now = Date.now();
      const newEntry = {
        attempts: entry.attempts + 1,
        firstAttempt: entry.attempts === 0 ? now : entry.firstAttempt,
        lastAttempt: now
      };
      await AsyncStorage.setItem(key, JSON.stringify(newEntry));
    } catch (error) {
      Logger.error('Failed to increment rate limit', { error, key });
    }
  }

  private async removeRateLimitEntry(key: string): Promise<void> {
    try {
      await AsyncStorage.removeItem(key);
    } catch (error) {
      Logger.error('Failed to remove rate limit entry', { error, key });
    }
  }

  private isRateLimited(
    entry: RateLimitEntry,
    config: RateLimitConfig
  ): boolean {
    const now = Date.now();
    const windowExpired = now - entry.firstAttempt > config.windowMs;
    
    if (windowExpired) {
      return false;
    }
    
    return entry.attempts >= config.maxAttempts;
  }

  /**
   * Start periodic cleanup of expired entries
   */
  private startCleanupInterval(): void {
    setInterval(() => {
      this.cleanup().catch(error => {
        Logger.error('Rate limit cleanup failed', { error });
      });
    }, 60 * 60 * 1000); // Run every hour
  }

  /**
   * Clean up expired rate limit entries
   */
  private async cleanup(): Promise<void> {
    try {
      const keys = await AsyncStorage.getAllKeys();
      const rateLimitKeys = keys.filter(key => key.startsWith(this.storageKey));

      for (const key of rateLimitKeys) {
        const [, action] = key.split(':');
        const config = this.configs[action];
        if (!config) continue;

        const entry = await this.getRateLimitEntry(key);
        if (Date.now() - entry.firstAttempt > config.windowMs) {
          await AsyncStorage.removeItem(key);
          Logger.debug('Cleaned up expired rate limit entry', { key });
        }
      }
    } catch (error) {
      Logger.error('Failed to cleanup rate limit entries', { error });
    }
  }
}

// Export singleton instance
export const rateLimitService = RateLimitService.getInstance();
