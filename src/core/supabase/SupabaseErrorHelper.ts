import { PostgrestError } from '@supabase/supabase-js';

export function handleSupabaseError(error: Error | PostgrestError): Error {
  // Handle PostgrestError specifically
  if (error instanceof PostgrestError) {
    switch (error.code) {
      case '42501':
        return new Error('You do not have permission to perform this action');
      case '23505':
        return new Error('This record already exists');
      case '23503':
        return new Error('Referenced record does not exist');
      default:
        return new Error(error.message || 'An unexpected database error occurred');
    }
  }
  
  // Handle generic Error instances
  return new Error(error.message || 'An unexpected error occurred');
}