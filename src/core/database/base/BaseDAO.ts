import { Logger } from '../../utils/error/Logger';
import { supabase } from '../../utils/supabase';
import { PostgrestError } from '@supabase/supabase-js';

export interface QueryOptions {
  page?: number;
  limit?: number;
  orderBy?: string;
  orderDirection?: 'asc' | 'desc';
  filters?: Record<string, any>;
}

export class DatabaseError extends Error {
  constructor(
    message: string,
    public readonly code: string,
    public readonly originalError?: any
  ) {
    super(message);
    this.name = 'DatabaseError';
  }
}

export abstract class BaseDAO<T extends Record<string, any>> {
  protected abstract tableName: string;
  protected supabase = supabase;

  /**
   * Creates a new record
   */
  public async create(data: Partial<T>): Promise<T> {
    try {
      const { data: result, error } = await supabase
        .from(this.tableName)
        .insert(data)
        .select()
        .single();

      if (error) throw this.handleError(error);
      if (!result) throw new DatabaseError(
        'Failed to create record',
        'DB_CREATE_FAILED'
      );

      Logger.info(`Created record in ${this.tableName}`, { id: result.id });
      return result as T;
    } catch (error) {
      Logger.error(`Failed to create record in ${this.tableName}`, { error, data });
      throw this.handleError(error);
    }
  }

  /**
   * Retrieves a record by ID
   */
  public async findById(id: string | number): Promise<T | null> {
    try {
      const { data: result, error } = await supabase
        .from(this.tableName)
        .select()
        .eq('id', id)
        .single();

      if (error) throw this.handleError(error);
      return result as T;
    } catch (error) {
      Logger.error(`Failed to find record by ID in ${this.tableName}`, { error, id });
      throw this.handleError(error);
    }
  }

  /**
   * Updates a record
   */
  public async update(id: string | number, data: Partial<T>): Promise<T> {
    try {
      const { data: result, error } = await supabase
        .from(this.tableName)
        .update(data)
        .eq('id', id)
        .select()
        .single();

      if (error) throw this.handleError(error);
      if (!result) throw new DatabaseError(
        'Failed to update record',
        'DB_UPDATE_FAILED'
      );

      Logger.info(`Updated record in ${this.tableName}`, { id });
      return result as T;
    } catch (error) {
      Logger.error(`Failed to update record in ${this.tableName}`, { error, id, data });
      throw this.handleError(error);
    }
  }

  /**
   * Deletes a record
   */
  public async delete(id: string | number): Promise<void> {
    try {
      const { error } = await supabase
        .from(this.tableName)
        .delete()
        .eq('id', id);

      if (error) throw this.handleError(error);
      Logger.info(`Deleted record from ${this.tableName}`, { id });
    } catch (error) {
      Logger.error(`Failed to delete record from ${this.tableName}`, { error, id });
      throw this.handleError(error);
    }
  }

  /**
   * Finds records based on query options
   */
  public async find(options: QueryOptions = {}): Promise<T[]> {
    try {
      let query = supabase
        .from(this.tableName)
        .select();

      // Apply filters
      if (options.filters) {
        for (const [key, value] of Object.entries(options.filters)) {
          if (Array.isArray(value)) {
            query = query.in(key, value);
          } else if (typeof value === 'object' && value !== null) {
            // Handle range queries
            if ('gt' in value) query = query.gt(key, value.gt);
            if ('gte' in value) query = query.gte(key, value.gte);
            if ('lt' in value) query = query.lt(key, value.lt);
            if ('lte' in value) query = query.lte(key, value.lte);
            if ('not' in value) query = query.neq(key, value.not);
          } else {
            query = query.eq(key, value);
          }
        }
      }

      // Apply pagination
      if (options.page !== undefined && options.limit !== undefined) {
        const start = (options.page - 1) * options.limit;
        query = query.range(start, start + options.limit - 1);
      }

      // Apply ordering
      if (options.orderBy) {
        query = query.order(options.orderBy, {
          ascending: options.orderDirection !== 'desc'
        });
      }

      const { data: results, error } = await query;

      if (error) throw this.handleError(error);
      return results as T[];
    } catch (error) {
      Logger.error(`Failed to find records in ${this.tableName}`, { error, options });
      throw this.handleError(error);
    }
  }

  /**
   * Counts records based on filters
   */
  public async count(filters?: Record<string, any>): Promise<number> {
    try {
      let query = supabase
        .from(this.tableName)
        .select('*', { count: 'exact', head: true });

      // Apply filters
      if (filters) {
        for (const [key, value] of Object.entries(filters)) {
          if (Array.isArray(value)) {
            query = query.in(key, value);
          } else if (typeof value === 'object' && value !== null) {
            if ('gt' in value) query = query.gt(key, value.gt);
            if ('gte' in value) query = query.gte(key, value.gte);
            if ('lt' in value) query = query.lt(key, value.lt);
            if ('lte' in value) query = query.lte(key, value.lte);
            if ('not' in value) query = query.neq(key, value.not);
          } else {
            query = query.eq(key, value);
          }
        }
      }

      const { count, error } = await query;

      if (error) throw this.handleError(error);
      return count || 0;
    } catch (error) {
      Logger.error(`Failed to count records in ${this.tableName}`, { error, filters });
      throw this.handleError(error);
    }
  }

  /**
   * Begins a transaction
   */
  protected async beginTransaction() {
    // Note: Supabase currently doesn't support client-side transactions
    // This is a placeholder for future implementation
    throw new DatabaseError(
      'Transactions are not currently supported',
      'DB_TRANSACTION_NOT_SUPPORTED'
    );
  }

  /**
   * Handles database errors
   */
  protected handleError(error: any): DatabaseError {
    if (error instanceof DatabaseError) {
      return error;
    }

    const pgError = error as PostgrestError;
    let code = 'DB_ERROR';
    let message = 'A database error occurred';

    switch (pgError.code) {
      case '23505': // unique_violation
        code = 'DB_UNIQUE_VIOLATION';
        message = 'A record with this value already exists';
        break;
      case '23503': // foreign_key_violation
        code = 'DB_FOREIGN_KEY_VIOLATION';
        message = 'Referenced record does not exist';
        break;
      case '42P01': // undefined_table
        code = 'DB_TABLE_NOT_FOUND';
        message = 'Table does not exist';
        break;
      case '42703': // undefined_column
        code = 'DB_COLUMN_NOT_FOUND';
        message = 'Column does not exist';
        break;
    }

    return new DatabaseError(message, code, error);
  }
}
