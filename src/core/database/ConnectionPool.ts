import { Logger } from '../../utils/error/Logger';
import { supabase } from '../../utils/supabase';
import { SupabaseClient } from '@supabase/supabase-js';

interface PoolConfig {
  maxSize: number;
  minSize: number;
  idleTimeoutMs: number;
  acquireTimeoutMs: number;
}

interface PoolMetrics {
  totalConnections: number;
  activeConnections: number;
  idleConnections: number;
  waitingRequests: number;
}

interface PooledConnection {
  client: SupabaseClient;
  lastUsed: number;
  isActive: boolean;
}

export class ConnectionPool {
  private static instance: ConnectionPool;
  private connections: PooledConnection[] = [];
  private waitingRequests: Array<{
    resolve: (connection: PooledConnection) => void;
    reject: (error: Error) => void;
    timestamp: number;
  }> = [];

  private readonly config: PoolConfig = {
    maxSize: 10,
    minSize: 2,
    idleTimeoutMs: 30000, // 30 seconds
    acquireTimeoutMs: 5000, // 5 seconds
  };

  private maintenanceInterval: NodeJS.Timeout;

  private constructor() {
    // Initialize minimum connections
    this.initializePool();
    
    // Start maintenance routine
    this.maintenanceInterval = setInterval(
      () => this.performMaintenance(),
      5000 // Run every 5 seconds
    );
  }

  public static getInstance(): ConnectionPool {
    if (!ConnectionPool.instance) {
      ConnectionPool.instance = new ConnectionPool();
    }
    return ConnectionPool.instance;
  }

  private async initializePool(): Promise<void> {
    try {
      // Create minimum number of connections
      for (let i = 0; i < this.config.minSize; i++) {
        await this.createConnection();
      }
      Logger.info('Connection pool initialized', {
        size: this.connections.length,
      });
    } catch (error) {
      Logger.error('Failed to initialize connection pool', { error });
      throw error;
    }
  }

  private async createConnection(): Promise<PooledConnection> {
    try {
      // In a real implementation, you would create a new Supabase client
      // However, since Supabase's JavaScript client is designed to be reused,
      // we'll use the existing client but wrap it in our pooling logic
      const connection: PooledConnection = {
        client: supabase,
        lastUsed: Date.now(),
        isActive: false,
      };

      this.connections.push(connection);
      Logger.debug('Created new database connection', {
        totalConnections: this.connections.length,
      });

      return connection;
    } catch (error) {
      Logger.error('Failed to create database connection', { error });
      throw error;
    }
  }

  /**
   * Acquires a connection from the pool
   */
  public async acquire(): Promise<SupabaseClient> {
    try {
      // Find an available connection
      const connection = this.connections.find(conn => !conn.isActive);
      
      if (connection) {
        connection.isActive = true;
        connection.lastUsed = Date.now();
        return connection.client;
      }

      // If no connection is available and we haven't reached max size, create new one
      if (this.connections.length < this.config.maxSize) {
        const newConnection = await this.createConnection();
        newConnection.isActive = true;
        return newConnection.client;
      }

      // If we've reached max size, wait for a connection
      return await this.waitForConnection();
    } catch (error) {
      Logger.error('Failed to acquire connection', { error });
      throw error;
    }
  }

  /**
   * Releases a connection back to the pool
   */
  public release(client: SupabaseClient): void {
    const connection = this.connections.find(conn => conn.client === client);
    if (connection) {
      connection.isActive = false;
      connection.lastUsed = Date.now();

      // If there are waiting requests, fulfill one
      if (this.waitingRequests.length > 0) {
        const request = this.waitingRequests.shift();
        if (request) {
          connection.isActive = true;
          request.resolve(connection);
        }
      }
    }
  }

  /**
   * Waits for a connection to become available
   */
  private waitForConnection(): Promise<SupabaseClient> {
    return new Promise((resolve, reject) => {
      const request = {
        resolve: (connection: PooledConnection) => resolve(connection.client),
        reject,
        timestamp: Date.now(),
      };

      this.waitingRequests.push(request);

      // Set timeout for the request
      setTimeout(() => {
        const index = this.waitingRequests.indexOf(request);
        if (index !== -1) {
          this.waitingRequests.splice(index, 1);
          reject(new Error('Connection acquire timeout'));
        }
      }, this.config.acquireTimeoutMs);
    });
  }

  /**
   * Performs pool maintenance
   */
  private async performMaintenance(): Promise<void> {
    try {
      const now = Date.now();

      // Remove expired waiting requests
      this.waitingRequests = this.waitingRequests.filter(request => {
        if (now - request.timestamp > this.config.acquireTimeoutMs) {
          request.reject(new Error('Connection acquire timeout'));
          return false;
        }
        return true;
      });

      // Close idle connections if we're above minSize
      if (this.connections.length > this.config.minSize) {
        const idleConnections = this.connections.filter(
          conn => !conn.isActive && (now - conn.lastUsed > this.config.idleTimeoutMs)
        );

        // Keep removing connections until we reach minSize
        while (
          idleConnections.length > 0 && 
          this.connections.length > this.config.minSize
        ) {
          const conn = idleConnections.pop();
          if (conn) {
            const index = this.connections.indexOf(conn);
            if (index !== -1) {
              this.connections.splice(index, 1);
              Logger.debug('Removed idle connection', {
                remainingConnections: this.connections.length,
              });
            }
          }
        }
      }
    } catch (error) {
      Logger.error('Error during pool maintenance', { error });
    }
  }

  /**
   * Gets current pool metrics
   */
  public getMetrics(): PoolMetrics {
    return {
      totalConnections: this.connections.length,
      activeConnections: this.connections.filter(conn => conn.isActive).length,
      idleConnections: this.connections.filter(conn => !conn.isActive).length,
      waitingRequests: this.waitingRequests.length,
    };
  }

  /**
   * Closes all connections and stops the pool
   */
  public async close(): Promise<void> {
    clearInterval(this.maintenanceInterval);

    // Reject any waiting requests
    this.waitingRequests.forEach(request => {
      request.reject(new Error('Connection pool is shutting down'));
    });
    this.waitingRequests = [];

    // In a real implementation, you would close each connection
    // But since we're using Supabase's client, we'll just clear our array
    this.connections = [];

    Logger.info('Connection pool closed');
  }
}

// Export singleton instance
export const connectionPool = ConnectionPool.getInstance();
