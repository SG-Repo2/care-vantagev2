import { Logger } from '../../../utils/error/Logger';

interface QueuedRequest<T> {
  id: string;
  execute: () => Promise<T>;
  retryCount: number;
  maxRetries: number;
  backoffMs: number;
}

export class RequestQueue {
  private queue: QueuedRequest<any>[] = [];
  private processing = false;
  private static readonly MAX_RETRIES = 3;
  private static readonly INITIAL_BACKOFF_MS = 1000;

  constructor(private concurrency: number = 1) {}

  async enqueue<T>(
    execute: () => Promise<T>,
    maxRetries: number = RequestQueue.MAX_RETRIES
  ): Promise<T> {
    const request: QueuedRequest<T> = {
      id: `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      execute,
      retryCount: 0,
      maxRetries,
      backoffMs: RequestQueue.INITIAL_BACKOFF_MS,
    };

    this.queue.push(request);
    Logger.debug('Request added to queue', { requestId: request.id });

    if (!this.processing) {
      this.processQueue();
    }

    return new Promise((resolve, reject) => {
      const checkResult = async () => {
        const index = this.queue.findIndex(r => r.id === request.id);
        if (index === -1) {
          // Request completed and was removed from queue
          try {
            const result = await execute();
            resolve(result);
          } catch (error) {
            reject(error);
          }
        } else {
          // Request still in queue, check again later
          setTimeout(checkResult, 100);
        }
      };

      checkResult();
    });
  }

  private async processQueue() {
    if (this.processing || this.queue.length === 0) {
      return;
    }

    this.processing = true;
    const activeRequests: Promise<void>[] = [];

    while (this.queue.length > 0 && activeRequests.length < this.concurrency) {
      const request = this.queue[0];
      this.queue.shift();

      const processRequest = async () => {
        try {
          await this.executeRequest(request);
        } catch (error) {
          Logger.error('Request failed', { 
            requestId: request.id, 
            error,
            retryCount: request.retryCount 
          });

          if (request.retryCount < request.maxRetries) {
            // Exponential backoff
            request.backoffMs *= 2;
            request.retryCount++;
            
            Logger.info('Retrying request', {
              requestId: request.id,
              retryCount: request.retryCount,
              backoffMs: request.backoffMs
            });

            await new Promise(resolve => setTimeout(resolve, request.backoffMs));
            this.queue.push(request);
          }
        }
      };

      activeRequests.push(processRequest());

      if (activeRequests.length >= this.concurrency) {
        await Promise.race(activeRequests);
      }
    }

    await Promise.all(activeRequests);
    this.processing = false;

    if (this.queue.length > 0) {
      this.processQueue();
    }
  }

  private async executeRequest(request: QueuedRequest<any>): Promise<void> {
    try {
      Logger.debug('Executing request', { 
        requestId: request.id,
        retryCount: request.retryCount 
      });
      
      await request.execute();
      
      Logger.debug('Request completed successfully', { 
        requestId: request.id 
      });
    } catch (error) {
      throw error;
    }
  }

  clearQueue() {
    this.queue = [];
    this.processing = false;
  }

  get queueLength(): number {
    return this.queue.length;
  }

  get isProcessing(): boolean {
    return this.processing;
  }
}