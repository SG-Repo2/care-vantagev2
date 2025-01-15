import { User } from '@supabase/supabase-js';

export interface TokenMetadata {
  issuedAt: number;
  expiresAt: number;
  tokenType: string;
  scope?: string[];
  sub?: string;
  email?: string;
  role?: string;
}

export interface Session {
  accessToken: string;
  refreshToken: string;
  expiresAt: number; // Unix timestamp in milliseconds
  userId: string;
  deviceId: string;
  lastValidated: number; // Timestamp of last backend validation
  validationInterval: number; // Interval for backend validation checks
  user?: User; // Optional Supabase user object
}

export interface SessionMetadata {
  lastActive: number; // Unix timestamp in milliseconds
  deviceInfo: {
    id: string;
    name: string;
    platform: string;
    lastLogin: number;
    osVersion?: string;
    appVersion?: string;
  };
}

export interface SessionEvent {
  type: 'session-renewed' | 'session-expired' | 'session-invalid';
  timestamp: number;
  sessionId?: string;
  error?: Error;
}

export interface StorageKeys {
  session: string;
  metadata: string;
  activeSessions: string;
  tokenBlacklist: string;
}

export interface TokenValidationResult {
  isValid: boolean;
  error?: string;
  metadata?: TokenMetadata;
}

export interface SessionRefreshOptions {
  maxRetries?: number;
  baseDelay?: number;
  force?: boolean;
}

export interface SessionManagerConfig {
  sessionTimeoutMs: number;
  validationIntervalMs: number;
  refreshBeforeExpiryMs: number;
  maxRefreshRetries: number;
  baseRefreshDelayMs: number;
}