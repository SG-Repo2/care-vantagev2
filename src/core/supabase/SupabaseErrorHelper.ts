import { PostgrestError } from '@supabase/supabase-js';

export class SupabaseErrorHelper {
  static handleError(error: PostgrestError): Error {
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
}