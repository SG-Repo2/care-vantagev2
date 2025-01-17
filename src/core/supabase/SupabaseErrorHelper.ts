import { 
  AuthError,
  InvalidCredentialsError,
  SessionExpiredError,
  UserNotFoundError,
  EmailAlreadyInUseError,
  NetworkError,
  UnauthorizedError,
  TooManyRequestsError,
  transformAuthError
} from '../auth/errors/AuthErrors';
import { PostgrestError } from '@supabase/supabase-js';

export function handleSupabaseError(error: Error | PostgrestError): never {
  // If it's already an AuthError instance, throw it directly
  if (error instanceof AuthError) {
    throw error;
  }

  // For Supabase PostgrestError
  if ('code' in error) {
    switch (error.code) {
      case '23505': // unique_violation
        throw new EmailAlreadyInUseError({ originalError: error });
      case '42501': // insufficient_privilege
        throw new UnauthorizedError({ originalError: error });
      case '429': // too_many_requests
        throw new TooManyRequestsError({ originalError: error });
    }
  }

  // For network-related errors
  if (error.message.toLowerCase().includes('network') || 
      error.message.toLowerCase().includes('connection')) {
    throw new NetworkError({ originalError: error });
  }

  // For other errors, use the transformAuthError helper
  throw transformAuthError(error);
}