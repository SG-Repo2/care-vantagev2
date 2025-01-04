import { Logger } from '../../utils/error/Logger';
import { monitor } from '../../utils/error/Monitor';

export class ErrorHandlingService {
  static handle(error: unknown, context: string): void {
    const errorInfo = {
      message: error instanceof Error ? error.message : String(error),
      context,
      timestamp: new Date().toISOString(),
      stack: error instanceof Error ? error.stack : undefined
    };

    Logger.error('Application error occurred', errorInfo);
    monitor.addAlert({
      severity: 'error',
      component: context,
      message: errorInfo.message,
      metadata: {
        stack: errorInfo.stack,
        timestamp: errorInfo.timestamp
      }
    });
    
    if (this.isNetworkError(error)) {
      this.handleNetworkError(error);
    } else if (this.isAuthError(error)) {
      this.handleAuthError(error);
    }
  }

  private static isNetworkError(error: unknown): boolean {
    return error instanceof Error && 
      (error.message.includes('Network') || 
       error.message.includes('ECONN'));
  }

  private static isAuthError(error: unknown): boolean {
    return error instanceof Error && 
      error.message.includes('Auth');
  }

  private static handleNetworkError(error: unknown): void {
    Logger.warn('Handling network error', { error });
    // Add network recovery logic here
  }

  private static handleAuthError(error: unknown): void {
    Logger.warn('Handling auth error', { error });
    // Add auth recovery logic here
  }

  static setupGlobalErrorHandlers(): void {
    if (typeof window !== 'undefined') {
      window.addEventListener('error', (event) => {
        this.handle(event.error, 'window_error');
      });

      window.addEventListener('unhandledrejection', (event) => {
        this.handle(event.reason, 'unhandled_rejection');
      });
    } else {
      process.on('uncaughtException', (error) => {
        this.handle(error, 'uncaught_exception');
      });

      process.on('unhandledRejection', (reason) => {
        this.handle(reason, 'unhandled_rejection');
      });
    }
  }
}

// Initialize global error handlers
ErrorHandlingService.setupGlobalErrorHandlers();