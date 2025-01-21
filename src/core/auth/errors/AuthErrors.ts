import { Logger } from '../../../utils/error/Logger';
import { AUTH_ERROR_CODES } from '../constants/auth.constants';

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

  // Helper method to check if an error is an AuthError
  static isAuthError(error: unknown): error is AuthError {
    return error instanceof AuthError;
  }

  // Helper method to get error details
  getErrorDetails() {
    return {
      name: this.name,
      message: this.message,
      code: this.code,
      context: this.context,
      stack: this.stack,
    };
  }
}

export class InvalidCredentialsError extends AuthError {
  constructor(context?: Record<string, any>) {
    super(
      'Invalid email or password provided',
      AUTH_ERROR_CODES.INVALID_CREDENTIALS,
      context
    );
    this.name = 'InvalidCredentialsError';
  }
}

export class SessionExpiredError extends AuthError {
  constructor(context?: Record<string, any>) {
    super(
      'Your session has expired. Please sign in again',
      AUTH_ERROR_CODES.SESSION_EXPIRED,
      context
    );
    this.name = 'SessionExpiredError';
  }
}

export class TokenRefreshError extends AuthError {
  constructor(context?: Record<string, any>) {
    super(
      'Failed to refresh authentication token',
      AUTH_ERROR_CODES.TOKEN_REFRESH_FAILED,
      context
    );
    this.name = 'TokenRefreshError';
  }
}

export class UserNotFoundError extends AuthError {
  constructor(context?: Record<string, any>) {
    super(
      'User account not found',
      AUTH_ERROR_CODES.USER_NOT_FOUND,
      context
    );
    this.name = 'UserNotFoundError';
  }
}

export class EmailAlreadyInUseError extends AuthError {
  constructor(context?: Record<string, any>) {
    super(
      'This email is already registered',
      AUTH_ERROR_CODES.EMAIL_IN_USE,
      context
    );
    this.name = 'EmailAlreadyInUseError';
  }
}

export class WeakPasswordError extends AuthError {
  constructor(context?: Record<string, any>) {
    super(
      'Password does not meet security requirements',
      AUTH_ERROR_CODES.WEAK_PASSWORD,
      context
    );
    this.name = 'WeakPasswordError';
  }
}

export class NetworkError extends AuthError {
  constructor(context?: Record<string, any>) {
    super(
      'Network error occurred during authentication',
      AUTH_ERROR_CODES.NETWORK_ERROR,
      context
    );
    this.name = 'NetworkError';
  }
}

export class UnauthorizedError extends AuthError {
  constructor(context?: Record<string, any>) {
    super(
      'You are not authorized to perform this action',
      AUTH_ERROR_CODES.UNAUTHORIZED,
      context
    );
    this.name = 'UnauthorizedError';
  }
}

export class TooManyRequestsError extends AuthError {
  constructor(context?: Record<string, any>) {
    super(
      'Too many authentication attempts. Please try again later',
      AUTH_ERROR_CODES.RATE_LIMIT,
      context
    );
    this.name = 'TooManyRequestsError';
  }
}

export class GoogleAuthError extends AuthError {
  constructor(context?: Record<string, any>) {
    super(
      'Failed to authenticate with Google',
      AUTH_ERROR_CODES.GOOGLE_ERROR,
      context
    );
    this.name = 'GoogleAuthError';
  }
}

export class AuthSessionError extends AuthError {
  constructor(context?: Record<string, any>) {
    super(
      'Authentication session error occurred',
      AUTH_ERROR_CODES.SESSION_ERROR,
      context
    );
    this.name = 'AuthSessionError';
  }
}

export class AuthSessionCancelledError extends AuthError {
  constructor(context?: Record<string, any>) {
    super(
      'Authentication was cancelled',
      AUTH_ERROR_CODES.SESSION_CANCELLED,
      context
    );
    this.name = 'AuthSessionCancelledError';
  }
}

interface SupabaseError {
  message: string;
  status?: number;
  name?: string;
  error_description?: string;
}

// Helper function to transform raw errors into typed AuthErrors
export function transformAuthError(error: unknown): AuthError {
  // Type guard for Supabase errors
  const isSupabaseError = (err: unknown): err is SupabaseError => {
    return typeof err === 'object' && err !== null && 'message' in err;
  };

  // Handle null or undefined errors
  if (!error) {
    return new AuthError(
      'An unknown authentication error occurred',
      AUTH_ERROR_CODES.UNKNOWN,
      { originalError: error }
    );
  }

  // Handle Expo Auth Session specific errors
  if (typeof error === 'object' && error !== null && 'type' in error) {
    const sessionError = error as { type: string; error?: string };
    if (sessionError.type === 'error') {
      if (sessionError.error?.includes('cancelled')) {
        return new AuthSessionCancelledError({ originalError: error });
      }
      return new AuthSessionError({ originalError: error });
    }
  }

  // Handle Supabase specific errors
  if (isSupabaseError(error)) {
    // Authentication errors
    if (error.message.includes('Invalid login credentials')) {
      return new InvalidCredentialsError({ originalError: error });
    }

    if (error.message.includes('JWT expired') || error.message.includes('token is expired')) {
      return new SessionExpiredError({ originalError: error });
    }

    if (error.message.includes('User not found')) {
      return new UserNotFoundError({ originalError: error });
    }

    if (error.message.includes('already registered') || error.message.includes('email already exists')) {
      return new EmailAlreadyInUseError({ originalError: error });
    }

    // Password related errors
    if (error.message.includes('password') && error.message.includes('requirements')) {
      return new WeakPasswordError({ originalError: error });
    }

    // Authorization errors
    if (error.status === 401 || error.message.includes('unauthorized')) {
      return new UnauthorizedError({ originalError: error });
    }

    // Rate limiting
    if (error.status === 429 || error.message.includes('too many requests')) {
      return new TooManyRequestsError({ originalError: error });
    }

    // Token refresh errors
    if (error.message.includes('refresh token')) {
      return new TokenRefreshError({ originalError: error });
    }
  }

  // Handle Google Auth specific errors
  if (error instanceof Error && error.message.includes('Google')) {
    return new GoogleAuthError({ originalError: error });
  }

  // Network related errors
  if (
    error instanceof Error && (
      error.message.includes('network') ||
      error.name === 'NetworkError' ||
      error.name === 'FetchError'
    )
  ) {
    return new NetworkError({ originalError: error });
  }

  // Default to base AuthError if no specific match
  const errorMessage = error instanceof Error ? error.message : 'An unknown authentication error occurred';
  return new AuthError(
    errorMessage,
    AUTH_ERROR_CODES.UNKNOWN,
    { originalError: error }
  );
}
