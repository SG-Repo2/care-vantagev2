import { HealthMetrics, HealthMetricsValidation } from '../providers/types';

export type HealthDataSource = 'apple_health' | 'health_connect';
export type UserId = string;
// Import and export the base service
import { BaseHealthMetricsService } from './BaseHealthMetricsService';
import { Logger } from '../../../utils/error/Logger';
import { syncQueue } from './SyncQueue';

export interface HealthMetricsService {
  getMetrics(userId: UserId, date: string): Promise<HealthMetrics>;
  updateMetrics(userId: UserId, metrics: Partial<HealthMetrics>): Promise<void>;
  validateMetrics(metrics: Partial<HealthMetrics>): HealthMetricsValidation;
  syncOfflineData(): Promise<void>;
  getProviderData(source: HealthDataSource): Promise<HealthMetrics>;
}

// Simple in-memory rate limiting
const requestTimestamps: { [key: string]: number[] } = {};
const RATE_LIMIT_WINDOW = 15 * 60 * 1000; // 15 minutes
const MAX_REQUESTS = 100;

function checkRateLimit(userId: string): boolean {
  const now = Date.now();
  const userTimestamps = requestTimestamps[userId] || [];
  
  // Remove timestamps outside the window
  const validTimestamps = userTimestamps.filter(
    timestamp => now - timestamp < RATE_LIMIT_WINDOW
  );
  
  requestTimestamps[userId] = validTimestamps;
  
  if (validTimestamps.length >= MAX_REQUESTS) {
    return false;
  }
  
  requestTimestamps[userId] = [...validTimestamps, now];
  return true;
}

export async function updateMetricsWithRetry(
  userId: string,
  metrics: Partial<HealthMetrics>,
  device_id: string
): Promise<void> {
  if (!checkRateLimit(userId)) {
    throw new Error('Rate limit exceeded. Please try again later.');
  }

  // Always queue updates for offline support
  await syncQueue.add(metrics, device_id);

  // If online, start processing the queue
  if (typeof window !== 'undefined' && window.navigator?.onLine) {
    await syncQueue.processQueue().catch(error => {
      Logger.error('Error processing sync queue:', { error });
    });
  }
}



export const healthMetricsService = BaseHealthMetricsService.getInstance();