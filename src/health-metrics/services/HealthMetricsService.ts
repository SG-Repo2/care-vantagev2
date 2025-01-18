import { HealthMetrics, HealthMetricsValidation, UserId, SyncQueueItem, SyncResult } from '../types';
import { monitor } from '../config/featureFlags';
import { Logger } from '../../utils/error/Logger';

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

// Sync queue with persistence
class SyncQueue {
  private queue: SyncQueueItem[] = [];
  private readonly maxRetries = 3;
  private readonly maxQueueSize = 1000;
  private processing = false;

  async add(metrics: Partial<HealthMetrics>, device_id: string): Promise<void> {
    const item: SyncQueueItem = {
      id: `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      metrics,
      timestamp: new Date().toISOString(),
      device_id,
      retry_count: 0
    };

    // Remove old items if queue is too large
    if (this.queue.length >= this.maxQueueSize) {
      this.queue = this.queue.slice(-this.maxQueueSize + 1);
    }

    this.queue.push(item);
    await this.persistQueue();

    // Try processing if not already running
    if (!this.processing) {
      this.processQueue().catch(error => {
        Logger.error('Error processing sync queue:', { error });
      });
    }
  }

  async processQueue(): Promise<void> {
    if (this.processing || this.queue.length === 0) return;

    this.processing = true;
    try {
      while (this.queue.length > 0) {
        const item = this.queue[0];
        
        if (item.retry_count >= this.maxRetries) {
          Logger.error('Max retries exceeded for sync item:', { item });
          this.queue.shift();
          continue;
        }

        try {
          const result = await this.syncItem(item);
          if (result.success) {
            this.queue.shift();
            monitor.trackMetricUpdate(result.metrics as HealthMetrics);
          } else {
            item.retry_count++;
            // Move to end of queue for retry
            this.queue.push(this.queue.shift()!);
          }
        } catch (error) {
          item.retry_count++;
          Logger.error('Error syncing item:', { error, item });
          // Move to end of queue for retry
          this.queue.push(this.queue.shift()!);
          // Add exponential backoff delay
          await new Promise(resolve => 
            setTimeout(resolve, Math.pow(2, item.retry_count) * 1000)
          );
        }

        await this.persistQueue();
      }
    } finally {
      this.processing = false;
    }
  }

  private async syncItem(item: SyncQueueItem): Promise<SyncResult> {
    try {
      const response = await fetch('/api/health-metrics', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'X-Device-ID': item.device_id
        },
        body: JSON.stringify({
          metrics: item.metrics,
          timestamp: item.timestamp
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      return { success: true, metrics: result, error: null };
    } catch (error) {
      return {
        success: false,
        metrics: null,
        error: {
          type: 'sync',
          message: error instanceof Error ? error.message : 'Sync failed',
          timestamp: new Date().toISOString(),
          device_id: item.device_id,
          details: error
        }
      };
    }
  }

  private async persistQueue(): Promise<void> {
    try {
      await localStorage.setItem('healthMetricsSyncQueue', JSON.stringify(this.queue));
    } catch (error) {
      Logger.error('Failed to persist sync queue:', { error });
    }
  }

  private async loadPersistedQueue(): Promise<void> {
    try {
      const persisted = await localStorage.getItem('healthMetricsSyncQueue');
      if (persisted) {
        this.queue = JSON.parse(persisted);
      }
    } catch (error) {
      Logger.error('Failed to load persisted sync queue:', { error });
    }
  }

  getQueueLength(): number {
    return this.queue.length;
  }

  clear(): void {
    this.queue = [];
    this.persistQueue().catch(error => {
      Logger.error('Failed to clear sync queue:', { error });
    });
  }
}

// Export singleton instance
export const syncQueue = new SyncQueue();

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