import { Logger } from '../../utils/error/Logger';
import { DatabaseError } from './BaseDAO';
import { databaseLogger } from './DatabaseLogger';
import { connectionPool } from './ConnectionPool';
import { SupabaseClient } from '@supabase/supabase-js';

interface TransactionOptions {
  timeout?: number;
  isolationLevel?: IsolationLevel;
  readOnly?: boolean;
}

enum IsolationLevel {
  ReadUncommitted = 'READ UNCOMMITTED',
  ReadCommitted = 'READ COMMITTED',
  RepeatableRead = 'REPEATABLE READ',
  Serializable = 'SERIALIZABLE',
}

interface Transaction {
  id: string;
  client: SupabaseClient;
  startTime: number;
  options: TransactionOptions;
}

export class TransactionManager {
  private static instance: TransactionManager;
  private activeTransactions: Map<string, Transaction> = new Map();
  private readonly defaultTimeout = 30000; // 30 seconds

  private constructor() {
    // Set up transaction cleanup interval
    setInterval(() => this.cleanupStaleTransactions(), 60000); // Run every minute
  }

  public static getInstance(): TransactionManager {
    if (!TransactionManager.instance) {
      TransactionManager.instance = new TransactionManager();
    }
    return TransactionManager.instance;
  }

  /**
   * Begins a new transaction
   * Note: Currently a placeholder as Supabase doesn't support client-side transactions
   */
  public async beginTransaction(options: TransactionOptions = {}): Promise<string> {
    try {
      // Get a connection from the pool
      const client = await connectionPool.acquire();

      const transactionId = this.generateTransactionId();
      const transaction: Transaction = {
        id: transactionId,
        client,
        startTime: Date.now(),
        options: {
          timeout: options.timeout || this.defaultTimeout,
          isolationLevel: options.isolationLevel || IsolationLevel.ReadCommitted,
          readOnly: options.readOnly || false,
        },
      };

      this.activeTransactions.set(transactionId, transaction);

      Logger.info('Transaction started', {
        transactionId,
        options: transaction.options,
      });

      // Start transaction timer
      const endTimer = databaseLogger.createQueryTimer();

      // Log transaction start
      databaseLogger.logQuery({
        query: 'BEGIN TRANSACTION',
        duration: endTimer(),
        success: true,
        source: 'TransactionManager.beginTransaction',
      });

      return transactionId;
    } catch (error) {
      Logger.error('Failed to begin transaction', { error, options });
      throw new DatabaseError(
        'Failed to begin transaction',
        'TRANSACTION_BEGIN_FAILED',
        error
      );
    }
  }

  /**
   * Commits a transaction
   */
  public async commit(transactionId: string): Promise<void> {
    try {
      const transaction = this.getTransaction(transactionId);
      
      // Start commit timer
      const endTimer = databaseLogger.createQueryTimer();

      // Log commit
      databaseLogger.logQuery({
        query: 'COMMIT',
        duration: endTimer(),
        success: true,
        source: 'TransactionManager.commit',
      });

      // Release the connection back to the pool
      connectionPool.release(transaction.client);

      // Remove from active transactions
      this.activeTransactions.delete(transactionId);

      Logger.info('Transaction committed', { transactionId });
    } catch (error) {
      Logger.error('Failed to commit transaction', { error, transactionId });
      throw new DatabaseError(
        'Failed to commit transaction',
        'TRANSACTION_COMMIT_FAILED',
        error
      );
    }
  }

  /**
   * Rolls back a transaction
   */
  public async rollback(transactionId: string): Promise<void> {
    try {
      const transaction = this.getTransaction(transactionId);
      
      // Start rollback timer
      const endTimer = databaseLogger.createQueryTimer();

      // Log rollback
      databaseLogger.logQuery({
        query: 'ROLLBACK',
        duration: endTimer(),
        success: true,
        source: 'TransactionManager.rollback',
      });

      // Release the connection back to the pool
      connectionPool.release(transaction.client);

      // Remove from active transactions
      this.activeTransactions.delete(transactionId);

      Logger.info('Transaction rolled back', { transactionId });
    } catch (error) {
      Logger.error('Failed to rollback transaction', { error, transactionId });
      throw new DatabaseError(
        'Failed to rollback transaction',
        'TRANSACTION_ROLLBACK_FAILED',
        error
      );
    }
  }

  /**
   * Gets a transaction by ID
   */
  public getTransaction(transactionId: string): Transaction {
    const transaction = this.activeTransactions.get(transactionId);
    if (!transaction) {
      throw new DatabaseError(
        'Transaction not found',
        'TRANSACTION_NOT_FOUND'
      );
    }
    return transaction;
  }

  /**
   * Checks if a transaction is active
   */
  public isTransactionActive(transactionId: string): boolean {
    return this.activeTransactions.has(transactionId);
  }

  /**
   * Gets all active transactions
   */
  public getActiveTransactions(): Transaction[] {
    return Array.from(this.activeTransactions.values());
  }

  /**
   * Cleans up stale transactions
   */
  private cleanupStaleTransactions(): void {
    const now = Date.now();
    
    for (const [id, transaction] of this.activeTransactions.entries()) {
      const age = now - transaction.startTime;
      
      if (age > transaction.options.timeout!) {
        Logger.warn('Cleaning up stale transaction', {
          transactionId: id,
          age,
          timeout: transaction.options.timeout,
        });

        // Attempt to rollback
        this.rollback(id).catch(error => {
          Logger.error('Failed to rollback stale transaction', {
            error,
            transactionId: id,
          });
        });
      }
    }
  }

  /**
   * Generates a unique transaction ID
   */
  private generateTransactionId(): string {
    return `txn_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Executes a function within a transaction
   */
  public async withTransaction<T>(
    fn: (transactionId: string) => Promise<T>,
    options: TransactionOptions = {}
  ): Promise<T> {
    const transactionId = await this.beginTransaction(options);

    try {
      const result = await fn(transactionId);
      await this.commit(transactionId);
      return result;
    } catch (error) {
      await this.rollback(transactionId);
      throw error;
    }
  }
}

// Export singleton instance
export const transactionManager = TransactionManager.getInstance();

// Transaction decorator
export function Transactional(options: TransactionOptions = {}) {
  return function (
    target: any,
    propertyKey: string,
    descriptor: PropertyDescriptor
  ) {
    const originalMethod = descriptor.value;

    descriptor.value = async function (...args: any[]) {
      return transactionManager.withTransaction(
        async (transactionId) => {
          return originalMethod.apply(this, [...args, transactionId]);
        },
        options
      );
    };

    return descriptor;
  };
}
