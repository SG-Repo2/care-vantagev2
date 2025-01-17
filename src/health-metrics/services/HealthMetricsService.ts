import { HealthMetrics, HealthMetricsValidation, UserId } from '../types';

export interface HealthMetricsService {
  getMetrics(userId: UserId, date: string): Promise<HealthMetrics>;
  updateMetrics(userId: UserId, metrics: Partial<HealthMetrics>): Promise<void>;
  validateMetrics(metrics: Partial<HealthMetrics>): HealthMetricsValidation;
  syncOfflineData(): Promise<void>;
  getProviderData(source: 'apple_health' | 'health_connect'): Promise<HealthMetrics>;
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

// Queue for offline data
const syncQueue: Array<{ metrics: Partial<HealthMetrics> }> = [];

async function updateMetricsWithRetry(userId: string, metrics: Partial<HealthMetrics>): Promise<void> {
  if (!checkRateLimit(userId)) {
    throw new Error('Rate limit exceeded. Please try again later.');
  }

  const maxRetries = 3;
  const baseDelay = 1000;
  let attempt = 0;

  while (attempt < maxRetries) {
    try {
      const response = await fetch('/api/health-metrics', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${userId}` // Add user context for rate limiting
        },
        body: JSON.stringify(metrics),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return;
    } catch (error) {
      attempt++;
      if (attempt === maxRetries) {
        if (error instanceof Error) {
          throw error;
        }
        throw new Error('Failed to update metrics');
      }

      // Exponential backoff
      const delay = baseDelay * Math.pow(2, attempt - 1);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
}

// Add metrics to sync queue for offline support
function queueMetricsSync(metrics: Partial<HealthMetrics>): void {
  syncQueue.push({ metrics });
}