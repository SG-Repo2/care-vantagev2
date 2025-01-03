import { Logger } from '../../utils/error/Logger';
import { PostgrestError } from '@supabase/supabase-js';

interface QueryLogEntry {
  query: string;
  params?: any[];
  duration: number;
  timestamp: string;
  success: boolean;
  error?: PostgrestError;
  source?: string;
}

interface PerformanceMetrics {
  averageQueryTime: number;
  totalQueries: number;
  errorRate: number;
  slowQueries: number;
}

export class DatabaseLogger {
  private static instance: DatabaseLogger;
  private queryLog: QueryLogEntry[] = [];
  private readonly maxLogSize = 1000;
  private readonly slowQueryThreshold = 1000; // 1 second

  // Performance tracking
  private totalQueryTime = 0;
  private totalQueries = 0;
  private totalErrors = 0;
  private slowQueries = 0;

  private constructor() {
    // Set up periodic log rotation
    setInterval(() => this.rotateLog(), 24 * 60 * 60 * 1000); // Daily rotation
  }

  public static getInstance(): DatabaseLogger {
    if (!DatabaseLogger.instance) {
      DatabaseLogger.instance = new DatabaseLogger();
    }
    return DatabaseLogger.instance;
  }

  /**
   * Logs a database query
   */
  public logQuery(entry: Omit<QueryLogEntry, 'timestamp'>): void {
    const logEntry: QueryLogEntry = {
      ...entry,
      timestamp: new Date().toISOString(),
    };

    // Update performance metrics
    this.totalQueries++;
    this.totalQueryTime += entry.duration;
    
    if (!entry.success) {
      this.totalErrors++;
    }
    
    if (entry.duration > this.slowQueryThreshold) {
      this.slowQueries++;
      Logger.warn('Slow query detected', {
        duration: entry.duration,
        query: entry.query,
        params: entry.params,
      });
    }

    // Add to log
    this.queryLog.unshift(logEntry);

    // Trim log if it exceeds max size
    if (this.queryLog.length > this.maxLogSize) {
      this.queryLog = this.queryLog.slice(0, this.maxLogSize);
    }

    // Log query details
    if (entry.success) {
      Logger.debug('Database query executed', {
        query: entry.query,
        duration: entry.duration,
        source: entry.source,
      });
    } else {
      Logger.error('Database query failed', {
        query: entry.query,
        error: entry.error,
        duration: entry.duration,
        source: entry.source,
      });
    }
  }

  /**
   * Gets performance metrics
   */
  public getPerformanceMetrics(): PerformanceMetrics {
    return {
      averageQueryTime: this.totalQueries ? this.totalQueryTime / this.totalQueries : 0,
      totalQueries: this.totalQueries,
      errorRate: this.totalQueries ? (this.totalErrors / this.totalQueries) * 100 : 0,
      slowQueries: this.slowQueries,
    };
  }

  /**
   * Gets recent queries
   */
  public getRecentQueries(limit: number = 100): QueryLogEntry[] {
    return this.queryLog.slice(0, limit);
  }

  /**
   * Gets slow queries
   */
  public getSlowQueries(): QueryLogEntry[] {
    return this.queryLog.filter(entry => entry.duration > this.slowQueryThreshold);
  }

  /**
   * Gets failed queries
   */
  public getFailedQueries(): QueryLogEntry[] {
    return this.queryLog.filter(entry => !entry.success);
  }

  /**
   * Gets queries by source
   */
  public getQueriesBySource(source: string): QueryLogEntry[] {
    return this.queryLog.filter(entry => entry.source === source);
  }

  /**
   * Rotates the log
   */
  private rotateLog(): void {
    const timestamp = new Date().toISOString().split('T')[0];
    
    // In a real application, you might want to:
    // 1. Store logs in a file or database
    // 2. Send logs to a monitoring service
    // 3. Compress and archive old logs
    
    Logger.info('Database log rotated', {
      entries: this.queryLog.length,
      date: timestamp,
    });

    // Reset metrics
    this.totalQueryTime = 0;
    this.totalQueries = 0;
    this.totalErrors = 0;
    this.slowQueries = 0;

    // Clear log
    this.queryLog = [];
  }

  /**
   * Creates a query timer
   */
  public createQueryTimer(): () => number {
    const start = process.hrtime();
    
    return () => {
      const [seconds, nanoseconds] = process.hrtime(start);
      return seconds * 1000 + nanoseconds / 1000000; // Convert to milliseconds
    };
  }

  /**
   * Formats a query for logging
   */
  public formatQuery(query: string, params?: any[]): string {
    if (!params || params.length === 0) return query;

    let formattedQuery = query;
    params.forEach((param, index) => {
      const placeholder = `$${index + 1}`;
      const value = typeof param === 'string' ? `'${param}'` : param;
      formattedQuery = formattedQuery.replace(placeholder, value);
    });

    return formattedQuery;
  }

  /**
   * Sanitizes sensitive data from query parameters
   */
  public sanitizeParams(params: any[]): any[] {
    return params.map(param => {
      if (typeof param === 'object' && param !== null) {
        return this.sanitizeObject(param);
      }
      return param;
    });
  }

  /**
   * Sanitizes sensitive data from objects
   */
  private sanitizeObject(obj: Record<string, any>): Record<string, any> {
    const sensitiveKeys = [
      'password',
      'token',
      'secret',
      'key',
      'auth',
      'credential',
      'private',
    ];

    const sanitized: Record<string, any> = {};
    
    for (const [key, value] of Object.entries(obj)) {
      if (sensitiveKeys.some(k => key.toLowerCase().includes(k))) {
        sanitized[key] = '[REDACTED]';
      } else if (typeof value === 'object' && value !== null) {
        sanitized[key] = this.sanitizeObject(value);
      } else {
        sanitized[key] = value;
      }
    }

    return sanitized;
  }
}

// Export singleton instance
export const databaseLogger = DatabaseLogger.getInstance();

// Query timing decorator
export function LogQuery(source?: string) {
  return function (
    target: any,
    propertyKey: string,
    descriptor: PropertyDescriptor
  ) {
    const originalMethod = descriptor.value;

    descriptor.value = async function (...args: any[]) {
      const logger = DatabaseLogger.getInstance();
      const endTimer = logger.createQueryTimer();

      try {
        const result = await originalMethod.apply(this, args);
        const duration = endTimer();

        logger.logQuery({
          query: args[0], // Assuming first argument is the query
          params: args.slice(1),
          duration,
          success: true,
          source: source || `${target.constructor.name}.${propertyKey}`,
        });

        return result;
      } catch (error) {
        const duration = endTimer();

        logger.logQuery({
          query: args[0],
          params: args.slice(1),
          duration,
          success: false,
          error: error as PostgrestError,
          source: source || `${target.constructor.name}.${propertyKey}`,
        });

        throw error;
      }
    };

    return descriptor;
  };
}
