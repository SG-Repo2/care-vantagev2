type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LogEntry {
  timestamp: string;
  level: LogLevel;
  message: string;
  context?: Record<string, any>;
}

export class Logger {
  private static instance: Logger;
  private logBuffer: LogEntry[] = [];
  private readonly maxBufferSize = 1000;
  private readonly logLevels: Record<LogLevel, number> = {
    debug: 0,
    info: 1,
    warn: 2,
    error: 3,
  };

  private constructor() {
    this.setupErrorHandlers();
  }

  private static getInstance(): Logger {
    if (!Logger.instance) {
      Logger.instance = new Logger();
    }
    return Logger.instance;
  }

  private setupErrorHandlers() {
    if (typeof window === 'undefined') {
      // Node.js environment
      process.on('uncaughtException', (error) => {
        Logger.error('Uncaught Exception:', { error });
      });

      process.on('unhandledRejection', (reason, promise) => {
        Logger.error('Unhandled Promise Rejection:', { reason, promise });
      });
    } else {
      // Browser environment
      window.addEventListener('error', (event) => {
        Logger.error('Uncaught Error:', { 
          error: event.error,
          message: event.message,
          filename: event.filename,
          lineno: event.lineno,
          colno: event.colno
        });
      });

      window.addEventListener('unhandledrejection', (event) => {
        Logger.error('Unhandled Promise Rejection:', { 
          reason: event.reason 
        });
      });
    }
  }

  private log(level: LogLevel, message: string, context?: Record<string, any>) {
    const entry = this.formatLogEntry(level, message, context);
    this.addToBuffer(entry);
    if (level === 'error') {
      this.flush();
    }
  }

  private formatLogEntry(level: LogLevel, message: string, context?: Record<string, any>): LogEntry {
    return {
      timestamp: new Date().toISOString(),
      level,
      message,
      context: this.sanitizeContext(context),
    };
  }

  private sanitizeContext(context?: Record<string, any>): Record<string, any> | undefined {
    if (!context) return undefined;

    const sanitized: Record<string, any> = {};
    
    for (const [key, value] of Object.entries(context)) {
      // Remove sensitive data
      if (this.isSensitiveKey(key)) {
        sanitized[key] = '[REDACTED]';
      } else if (value instanceof Error) {
        // Handle Error objects
        sanitized[key] = {
          name: value.name,
          message: value.message,
          stack: value.stack,
        };
      } else if (typeof value === 'object' && value !== null) {
        // Recursively sanitize nested objects
        sanitized[key] = this.sanitizeContext(value);
      } else {
        sanitized[key] = value;
      }
    }

    return sanitized;
  }

  private isSensitiveKey(key: string): boolean {
    const sensitivePatterns = [
      /password/i,
      /token/i,
      /secret/i,
      /key/i,
      /auth/i,
      /credential/i,
      /private/i,
    ];
    return sensitivePatterns.some(pattern => pattern.test(key));
  }

  private addToBuffer(entry: LogEntry) {
    this.logBuffer.push(entry);
    if (this.logBuffer.length > this.maxBufferSize) {
      this.flush();
    }
  }

  private flush() {
    if (this.logBuffer.length === 0) return;

    // In a real application, you might want to:
    // 1. Send logs to a backend service
    // 2. Store logs in local storage
    // 3. Write to a file in Node.js environment
    
    // Always log errors, regardless of environment
    this.logBuffer.forEach(entry => {
      const { level, message, context } = entry;
      if (level === 'error') {
        console.error(message, context);
      } else if (__DEV__) {
        // Only log non-errors in development
        console[level](message, context);
      }
    });

    this.logBuffer = [];
  }

  // Static methods for logging
  public static debug(message: string, context?: Record<string, any>) {
    const instance = Logger.getInstance();
    instance.log('debug', message, context);
  }

  public static info(message: string, context?: Record<string, any>) {
    const instance = Logger.getInstance();
    instance.log('info', message, context);
  }

  public static warn(message: string, context?: Record<string, any>) {
    const instance = Logger.getInstance();
    instance.log('warn', message, context);
  }

  public static error(message: string, context?: Record<string, any>) {
    const instance = Logger.getInstance();
    instance.log('error', message, context);
  }

  // Utility methods
  public static getBuffer(): LogEntry[] {
    return Logger.getInstance().logBuffer;
  }

  public static clearBuffer() {
    Logger.getInstance().logBuffer = [];
  }
}
