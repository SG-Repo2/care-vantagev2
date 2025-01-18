export { ErrorBoundary } from './ErrorBoundary';

// Error types that can be used across the application
export interface AppError extends Error {
  code?: string;
  context?: Record<string, unknown>;
}

// Helper function to create standardized error objects
export function createAppError(message: string, code?: string, context?: Record<string, unknown>): AppError {
  const error = new Error(message) as AppError;
  error.code = code;
  error.context = context;
  return error;
}

// Common error codes
export const ErrorCodes = {
  NETWORK_ERROR: 'NETWORK_ERROR',
  AUTH_ERROR: 'AUTH_ERROR',
  DATA_ERROR: 'DATA_ERROR',
  PROVIDER_ERROR: 'PROVIDER_ERROR',
  UNKNOWN_ERROR: 'UNKNOWN_ERROR',
} as const;

// Type for error codes
export type ErrorCode = typeof ErrorCodes[keyof typeof ErrorCodes];