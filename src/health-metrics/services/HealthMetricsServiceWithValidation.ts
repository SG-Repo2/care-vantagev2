import { HealthMetrics, HealthMetricsValidation, UserId, HealthError } from '../types';
import { HealthMetricsService } from './HealthMetricsService';
import { userValidationService, UserValidationError } from './UserValidationService';
import { supabase } from '../../utils/supabase';
import { validateMetrics } from '../../utils/HealthScoring';

export class ValidationError extends Error implements HealthError {
  type: 'validation';
  timestamp: string;
  details?: unknown;

  constructor(message: string, details?: unknown) {
    super(message);
    this.name = 'ValidationError';
    this.type = 'validation';
    this.timestamp = new Date().toISOString();
    this.details = details;
  }
}

export class HealthMetricsServiceWithValidation implements HealthMetricsService {
  private baseService: HealthMetricsService;

  constructor(baseService: HealthMetricsService) {
    this.baseService = baseService;
  }

  private async validateUserBeforeOperation(userId: UserId): Promise<void> {
    const { isValid, error } = await userValidationService.validateUser(userId);
    if (!isValid) {
      throw new ValidationError(
        'Cannot perform operation: User account is not valid',
        error
      );
    }
  }

  async getMetrics(userId: UserId, date: string): Promise<HealthMetrics> {
    await this.validateUserBeforeOperation(userId);
    return this.baseService.getMetrics(userId, date);
  }

  async updateMetrics(userId: UserId, metrics: Partial<HealthMetrics>): Promise<void> {
    await this.validateUserBeforeOperation(userId);
    
    // Validate metrics before passing to base service
    const validation = validateMetrics(metrics);
    if (!validation.isValid) {
      throw new ValidationError('Invalid metrics data', validation.errors);
    }

    return this.baseService.updateMetrics(userId, metrics);
  }

  validateMetrics(metrics: Partial<HealthMetrics>): HealthMetricsValidation {
    return validateMetrics(metrics);
  }

  async syncOfflineData(): Promise<void> {
    // For sync operations, we'll validate the user when processing each item
    // This allows us to skip deleted user data during sync
    return this.baseService.syncOfflineData();
  }

  async getProviderData(source: 'apple_health' | 'health_connect'): Promise<HealthMetrics> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      throw new ValidationError('No authenticated user found');
    }

    await this.validateUserBeforeOperation(user.id as UserId);
    return this.baseService.getProviderData(source);
  }
}

// Factory function to create validated service
export function createValidatedHealthMetricsService(
  baseService: HealthMetricsService
): HealthMetricsService {
  return new HealthMetricsServiceWithValidation(baseService);
}