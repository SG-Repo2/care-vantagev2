import { Platform } from 'react-native';

declare const global: {
  ErrorUtils: {
    setGlobalHandler: (callback: (error: Error, isFatal?: boolean) => void) => void;
  };
} & typeof globalThis;

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
    const errorHandler = (error: Error, isFatal?: boolean) => {
      Logger.error('Uncaught Exception:', { 
        error,
        isFatal,
        stack: error.stack,
        platform: Platform.OS
      });
      
      // Rethrow fatal errors after logging
      if (isFatal) {
        throw error;
      }
    };

    // Set up global error handler
    global.ErrorUtils.setGlobalHandler(errorHandler);

    // Set up development mode promise rejection handling
    if (__DEV__) {
      const originalConsoleError = console.error;
      console.error = (...args: any[]) => {
        originalConsoleError.apply(console, args);
        
        const firstArg = args[0];
        if (typeof firstArg === 'string' && 
            firstArg.includes('Possible Unhandled Promise Rejection')) {
          Logger.error('Unhandled Promise Rejection:', { 
            error: args[1],
            platform: Platform.OS
          });
        }
      };
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
      if (this.isSensitiveKey(key)) {
        sanitized[key] = '[REDACTED]';
      } else if (value instanceof Error) {
        sanitized[key] = {
          name: value.name,
          message: value.message,
          stack: value.stack,
        };
      } else if (typeof value === 'object' && value !== null) {
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

    this.logBuffer.forEach(entry => {
      const { level, message, context } = entry;
      if (level === 'error') {
        console.error(message, context);
      } else if (__DEV__) {
        console[level](message, context);
      }
    });

    this.logBuffer = [];
  }

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

  public static getBuffer(): LogEntry[] {
    return Logger.getInstance().logBuffer;
  }

  public static clearBuffer() {
    Logger.getInstance().logBuffer = [];
  }
}
