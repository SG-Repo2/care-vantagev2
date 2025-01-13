import type {
  HealthMetrics,
  HealthProvider,
  WeeklyMetrics,
  HealthError
} from '../types';
import { HealthDataValidator } from '../validators/healthDataValidator';
import {
  normalizeSteps,
  normalizeDistance,
  normalizeCalories,
  averageHeartRate
} from '../core/transforms/metricTransforms';
import { calculateHealthScore } from '../core/transforms/scoreCalculator';

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

      // Fetch raw metrics from platform-specific implementation
      const rawMetrics = await this.fetchNativeMetrics();
      
      // Apply transformations
      const transformedMetrics: HealthMetrics & WeeklyMetrics = {
        steps: normalizeSteps(rawMetrics.steps),
        distance: normalizeDistance(rawMetrics.distance),
        calories: normalizeCalories(rawMetrics.calories),
        heartRate: averageHeartRate([rawMetrics.heartRate]), // Convert to array
        lastUpdated: rawMetrics.lastUpdated,
        score: calculateHealthScore({
          steps: rawMetrics.steps,
          distance: rawMetrics.distance,
          calories: rawMetrics.calories,
          heartRate: rawMetrics.heartRate,
          lastUpdated: rawMetrics.lastUpdated
        }),
        weeklySteps: rawMetrics.weeklySteps,
        weeklyDistance: rawMetrics.weeklyDistance,
        weeklyCalories: rawMetrics.weeklyCalories,
        weeklyHeartRate: rawMetrics.weeklyHeartRate,
        startDate: rawMetrics.startDate,
        endDate: rawMetrics.endDate
      };

      // Validate transformed metrics
      const validation = HealthDataValidator.validateMetrics(transformedMetrics);
      if (!validation.isValid) {
        throw new Error(validation.error?.message || 'Invalid health metrics data');
      }

      return transformedMetrics;
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