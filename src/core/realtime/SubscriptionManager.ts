import { Logger } from '../../utils/error/Logger';
import { supabase } from '../../utils/supabase';
import { RealtimeChannel, RealtimePostgresChangesPayload } from '@supabase/supabase-js';

export type SubscriptionCallback<T extends Record<string, any> = Record<string, any>> = (
  payload: RealtimePostgresChangesPayload<T>
) => void;

interface PostgresChangesPayload<T extends Record<string, any> = Record<string, any>> {
  schema: string;
  table: string;
  commit_timestamp: string;
  eventType: 'INSERT' | 'UPDATE' | 'DELETE';
  new: T;
  old: T | null;
  errors: null | any[];
}

interface Subscription {
  id: string;
  channel: RealtimeChannel;
  table: string;
  filter?: string;
  event: 'INSERT' | 'UPDATE' | 'DELETE' | '*';
  callback: SubscriptionCallback;
  errorHandler?: (error: any) => void;
  status: 'SUBSCRIBING' | 'SUBSCRIBED' | 'ERROR' | 'CLOSED';
  createdAt: number;
  lastEventAt?: number;
}

export class SubscriptionManager {
  private static instance: SubscriptionManager;
  private subscriptions: Map<string, Subscription> = new Map();
  private reconnectAttempts = 0;
  private readonly maxReconnectAttempts = 5;
  private readonly reconnectDelayMs = 1000; // Start with 1 second

  private constructor() {
    this.setupConnectionHandling();
  }

  public static getInstance(): SubscriptionManager {
    if (!SubscriptionManager.instance) {
      SubscriptionManager.instance = new SubscriptionManager();
    }
    return SubscriptionManager.instance;
  }

  /**
   * Sets up connection handling and auto-reconnect
   */
  private setupConnectionHandling(): void {
    supabase.channel('system').on(
      'presence' as any, // Using presence as a workaround since system events are internal
      { event: 'sync' },
      (status: 'SUBSCRIBED' | 'CLOSED' | 'ERROR') => {
      switch (status) {
        case 'SUBSCRIBED':
          Logger.info('Realtime connection established');
          this.reconnectAttempts = 0;
          this.resubscribeAll();
          break;
        case 'CLOSED':
          Logger.warn('Realtime connection closed');
          this.handleDisconnect();
          break;
        case 'ERROR':
          Logger.error('Realtime connection error');
          this.handleDisconnect();
          break;
      }
    });
  }

  /**
   * Handles disconnection and reconnection attempts
   */
  private async handleDisconnect(): Promise<void> {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      Logger.error('Max reconnection attempts reached');
      this.markAllSubscriptionsError();
      return;
    }

    const delay = this.reconnectDelayMs * Math.pow(2, this.reconnectAttempts);
    this.reconnectAttempts++;

    Logger.info('Attempting to reconnect', {
      attempt: this.reconnectAttempts,
      delay,
    });

    await new Promise(resolve => setTimeout(resolve, delay));
    await this.resubscribeAll();
  }

  /**
   * Creates a new subscription
   */
  public async subscribe(
    table: string,
    callback: SubscriptionCallback,
    options: {
      event?: 'INSERT' | 'UPDATE' | 'DELETE' | '*';
      filter?: string;
      errorHandler?: (error: any) => void;
    } = {}
  ): Promise<string> {
    try {
      const subscriptionId = this.generateSubscriptionId();
      
      const channel = supabase.channel(subscriptionId)
        .on('postgres_changes' as any, {
          event: options.event || '*',
          schema: 'public',
          table,
          filter: options.filter,
        }, (payload) => {
          try {
            const subscription = this.subscriptions.get(subscriptionId);
            if (subscription) {
              subscription.lastEventAt = Date.now();
              // Transform the payload to match Supabase's structure
              const transformedPayload = {
                schema: 'public',
                table: subscription.table,
                commit_timestamp: new Date().toISOString(),
                eventType: subscription.event === '*' ? 'UPDATE' : subscription.event,
                new: payload.payload,
                old: null,
                errors: [] as string[]
              };
              
              callback(transformedPayload as unknown as RealtimePostgresChangesPayload<any>);
            }
          } catch (error) {
            Logger.error('Error in subscription callback', {
              error,
              subscriptionId,
              table,
            });
            if (options.errorHandler) {
              options.errorHandler(error);
            }
          }
        });

      const subscription: Subscription = {
        id: subscriptionId,
        channel,
        table,
        filter: options.filter,
        event: options.event || '*',
        callback,
        errorHandler: options.errorHandler,
        status: 'SUBSCRIBING',
        createdAt: Date.now(),
      };

      this.subscriptions.set(subscriptionId, subscription);

      await channel.subscribe();
      
      subscription.status = 'SUBSCRIBED';
      Logger.info('Subscription created', {
        subscriptionId,
        table,
        event: options.event,
      });

      return subscriptionId;
    } catch (error) {
      Logger.error('Failed to create subscription', {
        error,
        table,
        event: options.event,
      });
      throw error;
    }
  }

  /**
   * Unsubscribes from a subscription
   */
  public async unsubscribe(subscriptionId: string): Promise<void> {
    try {
      const subscription = this.subscriptions.get(subscriptionId);
      if (!subscription) {
        Logger.warn('Subscription not found', { subscriptionId });
        return;
      }

      await subscription.channel.unsubscribe();
      this.subscriptions.delete(subscriptionId);

      Logger.info('Subscription removed', { subscriptionId });
    } catch (error) {
      Logger.error('Failed to unsubscribe', { error, subscriptionId });
      throw error;
    }
  }

  /**
   * Resubscribes all active subscriptions
   */
  private async resubscribeAll(): Promise<void> {
    const subscriptions = Array.from(this.subscriptions.values());
    
    for (const subscription of subscriptions) {
      try {
        await subscription.channel.subscribe();
        subscription.status = 'SUBSCRIBED';
        Logger.info('Resubscribed successfully', {
          subscriptionId: subscription.id,
        });
      } catch (error) {
        Logger.error('Failed to resubscribe', {
          error,
          subscriptionId: subscription.id,
        });
        subscription.status = 'ERROR';
        if (subscription.errorHandler) {
          subscription.errorHandler(error);
        }
      }
    }
  }

  /**
   * Marks all subscriptions as error state
   */
  private markAllSubscriptionsError(): void {
    for (const subscription of this.subscriptions.values()) {
      subscription.status = 'ERROR';
      if (subscription.errorHandler) {
        subscription.errorHandler(new Error('Connection lost'));
      }
    }
  }

  /**
   * Gets a subscription by ID
   */
  public getSubscription(subscriptionId: string): Subscription | undefined {
    return this.subscriptions.get(subscriptionId);
  }

  /**
   * Gets all active subscriptions
   */
  public getActiveSubscriptions(): Subscription[] {
    return Array.from(this.subscriptions.values())
      .filter(sub => sub.status === 'SUBSCRIBED');
  }

  /**
   * Checks if a subscription is active
   */
  public isSubscriptionActive(subscriptionId: string): boolean {
    const subscription = this.subscriptions.get(subscriptionId);
    return subscription?.status === 'SUBSCRIBED';
  }

  /**
   * Generates a unique subscription ID
   */
  private generateSubscriptionId(): string {
    return `sub_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Closes all subscriptions
   */
  public async closeAll(): Promise<void> {
    const subscriptions = Array.from(this.subscriptions.values());
    
    for (const subscription of subscriptions) {
      try {
        await subscription.channel.unsubscribe();
        subscription.status = 'CLOSED';
      } catch (error) {
        Logger.error('Failed to close subscription', {
          error,
          subscriptionId: subscription.id,
        });
      }
    }

    this.subscriptions.clear();
    Logger.info('All subscriptions closed');
  }
}

// Export singleton instance
export const subscriptionManager = SubscriptionManager.getInstance();
