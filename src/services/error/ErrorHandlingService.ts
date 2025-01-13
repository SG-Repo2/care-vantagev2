import { Platform } from 'react-native';
import { Logger } from '../../utils/error/Logger';
import { monitor } from '../../utils/error/Monitor';

type ErrorHandlerType = (error: Error, isFatal?: boolean) => void;

interface ReactNativeGlobal extends Global {
  ErrorUtils: {
    setGlobalHandler: (callback: ErrorHandlerType) => void;
    getGlobalHandler: () => ErrorHandlerType;
  };
}

declare const global: ReactNativeGlobal;

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
    if (Platform.OS === 'web') {
      // Web-specific error handling
      window.addEventListener('error', (event: ErrorEvent) => {
        this.handle(event.error, 'window_error');
      });

      window.addEventListener('unhandledrejection', (event: PromiseRejectionEvent) => {
        this.handle(event.reason, 'unhandled_rejection');
      });
    } else {
      // React Native error handling
      const defaultHandler = global.ErrorUtils.getGlobalHandler();
      
      global.ErrorUtils.setGlobalHandler((error: Error, isFatal?: boolean) => {
        this.handle(error, isFatal ? 'fatal_error' : 'react_native_error');
        defaultHandler(error, isFatal);
      });
    }
  }
}
