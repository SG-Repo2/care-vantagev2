import type { 
  HealthMetrics, 
  HealthProvider, 
  WeeklyMetrics,
  HealthError 
} from '../types';
import { HealthDataValidator } from '../validators/healthDataValidator';

export abstract class BaseHealthProvider implements HealthProvider {
  protected authorized = false;
  protected initialized = false;

  /**
   * Initialize the health provider with platform-specific setup
   */
  async initialize(): Promise<void> {
    try {
      await this.initializeNative();
      this.initialized = true;
      
      // Request permissions after initialization
      await this.requestPermissions();
    } catch (error) {
      this.initialized = false;
      const healthError: HealthError = {
        type: 'initialization',
        message: error instanceof Error ? error.message : 'Failed to initialize health provider',
        details: error
      };
      throw healthError;
    }
  }

  /**
   * Request necessary health data permissions
   */
  async requestPermissions(): Promise<void> {
    try {
      if (!this.initialized) {
        throw new Error('Provider not initialized');
      }

      await this.requestNativePermissions();
      this.authorized = true;
    } catch (error) {
      this.authorized = false;
      const healthError: HealthError = {
        type: 'permissions',
        message: error instanceof Error ? error.message : 'Failed to request health permissions',
        details: error
      };
      throw healthError;
    }
  }

  /**
   * Check if required permissions are granted
   */
  async hasPermissions(): Promise<boolean> {
    return this.authorized;
  }

  /**
   * Get current health metrics and weekly aggregates
   */
  async getMetrics(): Promise<HealthMetrics & WeeklyMetrics> {
    try {
      if (!this.authorized || !this.initialized) {
        throw new Error('Not authorized to access health data');
      }

      const metrics = await this.fetchNativeMetrics();
      const validation = HealthDataValidator.validateMetrics(metrics);

      if (!validation.isValid) {
        throw new Error(validation.error?.message || 'Invalid health metrics data');
      }

      return metrics;
    } catch (error) {
      const healthError: HealthError = {
        type: 'data',
        message: error instanceof Error ? error.message : 'Failed to fetch health metrics',
        details: error
      };
      throw healthError;
    }
  }

  /**
   * Get weekly health data for a specific time range
   */
  async getWeeklyData(startDate: string, endDate: string): Promise<WeeklyMetrics> {
    try {
      if (!this.authorized || !this.initialized) {
        throw new Error('Not authorized to access health data');
      }

      const weeklyData = await this.fetchNativeWeeklyData(startDate, endDate);
      const validation = HealthDataValidator.validateWeeklyData(weeklyData);

      if (!validation.isValid) {
        throw new Error(validation.error?.message || 'Invalid weekly health data');
      }

      return weeklyData;
    } catch (error) {
      const healthError: HealthError = {
        type: 'data',
        message: error instanceof Error ? error.message : 'Failed to fetch weekly health data',
        details: error
      };
      throw healthError;
    }
  }

  /**
   * Sync health data (optional operation)
   */
  async sync(): Promise<void> {
    try {
      if (!this.authorized || !this.initialized) {
        console.warn('Health permissions not granted, skipping sync');
        return;
      }

      await this.syncNative?.();
    } catch (error) {
      const healthError: HealthError = {
        type: 'data',
        message: error instanceof Error ? error.message : 'Failed to sync health data',
        details: error
      };
      throw healthError;
    }
  }

  // Abstract methods to be implemented by platform-specific providers

  /**
   * Platform-specific initialization logic
   */
  protected abstract initializeNative(): Promise<void>;

  /**
   * Platform-specific permission request logic
   */
  protected abstract requestNativePermissions(): Promise<void>;

  /**
   * Platform-specific metric fetching logic
   */
  protected abstract fetchNativeMetrics(): Promise<HealthMetrics & WeeklyMetrics>;

  /**
   * Platform-specific weekly data fetching logic
   */
  protected abstract fetchNativeWeeklyData(startDate: string, endDate: string): Promise<WeeklyMetrics>;

  /**
   * Optional platform-specific sync logic
   */
  protected syncNative?(): Promise<void>;
}