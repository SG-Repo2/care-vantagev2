import { AuthError } from '@supabase/supabase-js';

export class ErrorHandler {
  static handle(error: unknown, context: string): Error {
    console.error(`[${context}] Error:`, error);
    
    if (error instanceof Error) {
      return error;
    }
    
    if (error instanceof AuthError) {
      return new Error(error.message);
    }
    
    return new Error(
      typeof error === 'string' ? error : 'An unexpected error occurred'
    );
  }

  static async handleAsync<T>(
    promise: Promise<T>,
    context: string
  ): Promise<[T | null, Error | null]> {
    try {
      const result = await promise;
      return [result, null];
    } catch (error) {
      return [null, this.handle(error, context)];
    }
  }

  static getErrorMessage(error: unknown): string {
    if (error instanceof Error) {
      if (error.message.includes('Invalid login credentials')) {
        return 'Invalid email or password. Please try again.';
      }
      if (error.message.includes('Email not confirmed')) {
        return 'Please check your email to confirm your account.';
      }
      if (error.message.includes('Permission denied')) {
        return 'Unable to access required permissions. Please try signing out and signing in again.';
      }
      return error.message;
    }
    return 'An unexpected error occurred';
  }
}