import { supabase } from '../../utils/supabase';
import { UserId, HealthError } from '../types';

export class UserValidationError extends Error implements HealthError {
  type: 'validation';
  timestamp: string;
  deviceId?: string;
  details?: unknown;

  constructor(message: string, details?: unknown) {
    super(message);
    this.name = 'UserValidationError';
    this.type = 'validation';
    this.timestamp = new Date().toISOString();
    this.details = details;
  }
}

export interface UserValidationResult {
  isValid: boolean;
  error?: UserValidationError;
}

export class UserValidationService {
  private static instance: UserValidationService;
  private validationCache: Map<string, { result: boolean; timestamp: number }>;
  private readonly CACHE_TTL = 5 * 60 * 1000; // 5 minutes

  private constructor() {
    this.validationCache = new Map();
  }

  public static getInstance(): UserValidationService {
    if (!UserValidationService.instance) {
      UserValidationService.instance = new UserValidationService();
    }
    return UserValidationService.instance;
  }

  private getCachedValidation(userId: string): boolean | null {
    const cached = this.validationCache.get(userId);
    if (!cached) return null;

    const now = Date.now();
    if (now - cached.timestamp > this.CACHE_TTL) {
      this.validationCache.delete(userId);
      return null;
    }

    return cached.result;
  }

  private setCachedValidation(userId: string, isValid: boolean): void {
    this.validationCache.set(userId, {
      result: isValid,
      timestamp: Date.now()
    });
  }

  public async validateUser(userId: UserId): Promise<UserValidationResult> {
    try {
      // Check cache first
      const cachedResult = this.getCachedValidation(userId as string);
      if (cachedResult !== null) {
        return { isValid: cachedResult };
      }

      // Query database for user status
      const { data: userProfile, error } = await supabase
        .from('users')
        .select('deleted_at')
        .eq('id', userId)
        .single();

      if (error) {
        throw new UserValidationError('Failed to validate user', error);
      }

      if (!userProfile) {
        this.setCachedValidation(userId as string, false);
        return {
          isValid: false,
          error: new UserValidationError('User not found')
        };
      }

      const isValid = !userProfile.deleted_at;
      this.setCachedValidation(userId as string, isValid);

      if (!isValid) {
        return {
          isValid: false,
          error: new UserValidationError('User account has been deleted', {
            deletedAt: userProfile.deleted_at
          })
        };
      }

      return { isValid: true };
    } catch (error) {
      if (error instanceof UserValidationError) {
        throw error;
      }
      throw new UserValidationError('Validation failed', error);
    }
  }

  public clearCache(userId?: string): void {
    if (userId) {
      this.validationCache.delete(userId);
    } else {
      this.validationCache.clear();
    }
  }
}

// Export singleton instance
export const userValidationService = UserValidationService.getInstance();