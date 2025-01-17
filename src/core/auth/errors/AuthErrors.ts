import { Logger } from '../../../utils/error/Logger';

export class AuthError extends Error {
  constructor(
    message: string,
    public readonly code: string,
    public readonly context?: Record<string, any>
  ) {
    super(message);
    this.name = 'AuthError';
    
    // Log the error with context
    Logger.error('Authentication error occurred', {
      code,
      message,
      context,
      stack: this.stack,
    });
  }
}

export class InvalidCredentialsError extends AuthError {
  constructor(context?: Record<string, any>) {
    super(
      'Invalid email or password provided',
      'AUTH_INVALID_CREDENTIALS',
      context
    );
    this.name = 'InvalidCredentialsError';
  }
}

export class SessionExpiredError extends AuthError {
  constructor(context?: Record<string, any>) {
    super(
      'Your session has expired. Please sign in again',
      'AUTH_SESSION_EXPIRED',
      context
    );
    this.name = 'SessionExpiredError';
  }
}

export class TokenRefreshError extends AuthError {
  constructor(context?: Record<string, any>) {
    super(
      'Failed to refresh authentication token',
      'AUTH_TOKEN_REFRESH_FAILED',
      context
    );
    this.name = 'TokenRefreshError';
  }
}

export class UserNotFoundError extends AuthError {
  constructor(context?: Record<string, any>) {
    super(
      'User account not found',
      'AUTH_USER_NOT_FOUND',
      context
    );
    this.name = 'UserNotFoundError';
  }
}

export class EmailAlreadyInUseError extends AuthError {
  constructor(context?: Record<string, any>) {
    super(
      'This email is already registered',
      'AUTH_EMAIL_IN_USE',
      context
    );
    this.name = 'EmailAlreadyInUseError';
  }
}

export class WeakPasswordError extends AuthError {
  constructor(context?: Record<string, any>) {
    super(
      'Password does not meet security requirements',
      'AUTH_WEAK_PASSWORD',
      context
    );
    this.name = 'WeakPasswordError';
  }
}

export class NetworkError extends AuthError {
  constructor(context?: Record<string, any>) {
    super(
      'Network error occurred during authentication',
      'AUTH_NETWORK_ERROR',
      context
    );
    this.name = 'NetworkError';
  }
}

export class UnauthorizedError extends AuthError {
  constructor(context?: Record<string, any>) {
    super(
      'You are not authorized to perform this action',
      'AUTH_UNAUTHORIZED',
      context
    );
    this.name = 'UnauthorizedError';
  }
}

export class TooManyRequestsError extends AuthError {
  constructor(context?: Record<string, any>) {
    super(
      'Too many authentication attempts. Please try again later',
      'AUTH_RATE_LIMIT',
      context
    );
    this.name = 'TooManyRequestsError';
  }
}

// New error classes for Expo Auth Session
export class GoogleAuthError extends AuthError {
  constructor(context?: Record<string, any>) {
    super(
      'Failed to authenticate with Google',
      'AUTH_GOOGLE_ERROR',
      context
    );
    this.name = 'GoogleAuthError';
  }
}

export class AuthSessionError extends AuthError {
  constructor(context?: Record<string, any>) {
    super(
      'Authentication session error occurred',
      'AUTH_SESSION_ERROR',
      context
    );
    this.name = 'AuthSessionError';
  }
}

export class AuthSessionCancelledError extends AuthError {
  constructor(context?: Record<string, any>) {
    super(
      'Authentication was cancelled',
      'AUTH_SESSION_CANCELLED',
      context
    );
    this.name = 'AuthSessionCancelledError';
  }
}

// Helper function to transform raw errors into typed AuthErrors
export function transformAuthError(error: any): AuthError {
  // Handle Expo Auth Session specific errors
  if (error?.type === 'error') {
    if (error.error?.includes('cancelled')) {
      return new AuthSessionCancelledError({ originalError: error });
    }
    return new AuthSessionError({ originalError: error });
  }

  // Handle Google Auth specific errors
  if (error?.message?.includes('Google')) {
    return new GoogleAuthError({ originalError: error });
  }

  // Handle Supabase specific errors
  if (error?.message?.includes('Invalid login credentials')) {
    return new InvalidCredentialsError({ originalError: error });
  }
  
  if (error?.message?.includes('JWT expired')) {
    return new SessionExpiredError({ originalError: error });
  }
  
  if (error?.message?.includes('User not found')) {
    return new UserNotFoundError({ originalError: error });
  }
  
  if (error?.message?.includes('already registered')) {
    return new EmailAlreadyInUseError({ originalError: error });
  }
  
  // Network related errors
  if (error?.message?.includes('network') || error?.name === 'NetworkError') {
    return new NetworkError({ originalError: error });
  }
  
  // Default to base AuthError if no specific match
  return new AuthError(
    error?.message || 'An unknown authentication error occurred',
    'AUTH_UNKNOWN',
    { originalError: error }
  );
}
