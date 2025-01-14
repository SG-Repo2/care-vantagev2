import { Logger } from '@utils/error/Logger';
import { SessionExpiredError, TokenRefreshError } from '@core/auth/errors/AuthErrors';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '@utils/supabase';
import * as jose from 'jose';
import * as Crypto from 'expo-crypto';

interface TokenMetadata {
  issuedAt: number;
  expiresAt: number;
  tokenType: string;
  scope?: string[];
}

interface Session {
  accessToken: string;
  refreshToken: string;
  expiresAt: number; // Unix timestamp in milliseconds
  userId: string;
  deviceId: string;
  lastValidated: number; // Timestamp of last backend validation
  validationInterval: number; // Interval for backend validation checks
}

interface SessionMetadata {
  lastActive: number; // Unix timestamp in milliseconds
  deviceInfo: {
    id: string;
    name: string;
    platform: string;
    lastLogin: number;
  };
}

type SessionEvent = 'session-renewed' | 'session-expired' | 'session-invalid';

export class SessionManager {
  private static instance: SessionManager;
  private currentSession: Session | null = null;
  private readonly sessionTimeoutMs = 30 * 60 * 1000; // 30 minutes
  private eventListeners: Map<SessionEvent, Set<Function>> = new Map();
  private readonly storageKeys = {
    session: '@auth_session',
    metadata: '@session_metadata',
    activeSessions: '@active_sessions',
    tokenBlacklist: '@token_blacklist',
  };
  private refreshTimeout: NodeJS.Timeout | null = null;

  private constructor() {
    // Initialize session management
    this.initializeSession();
    
    // Start periodic cleanup of blacklist
    setInterval(() => {
      this.cleanupBlacklist().catch(error => {
        Logger.error('Blacklist cleanup failed', { error });
      });
    }, 60 * 60 * 1000); // Run every hour
  }

  public static getInstance(): SessionManager {
    if (!SessionManager.instance) {
      SessionManager.instance = new SessionManager();
    }
    return SessionManager.instance;
  }

  private async initializeSession() {
    try {
      // Attempt to restore session from storage
      const storedSession = await this.getStoredSession();
      if (storedSession) {
        // Verify and refresh if needed
        await this.verifyAndRefreshSession(storedSession);
      }
    } catch (error) {
      Logger.error('Failed to initialize session', { error });
      // Clear invalid session
      await this.clearSession();
    }
  }

  private async getStoredSession(): Promise<Session | null> {
    try {
      const sessionJson = await AsyncStorage.getItem(this.storageKeys.session);
      return sessionJson ? JSON.parse(sessionJson) : null;
    } catch (error) {
      Logger.error('Failed to retrieve stored session', { error });
      return null;
    }
  }

  private async verifyAndRefreshSession(session: Session): Promise<void> {
    const now = Date.now();
    
    // Check if session needs backend validation
    if (now - session.lastValidated >= session.validationInterval) {
      try {
        await this.validateSessionWithBackend(session);
        session.lastValidated = now;
      } catch (error) {
        Logger.warn('Session validation failed', { error });
        // Continue with refresh if validation fails
      }
    }

    // Check if session is expired
    if (now >= session.expiresAt) {
      // Attempt to refresh the session with retry
      await this.refreshSessionWithRetry(session);
    } else {
      // Session is still valid, schedule refresh
      this.scheduleTokenRefresh(session);
      this.currentSession = session;
      await this.updateSessionMetadata();
    }
  }

  private async validateSessionWithBackend(session: Session): Promise<void> {
    try {
      // First validate token structure and check blacklist
      const isValid = await this.validateTokenStructure(session.accessToken);
      if (!isValid) {
        throw new SessionExpiredError({ message: 'Invalid token structure or blacklisted' });
      }

      // Then verify with Supabase
      const { error } = await supabase.auth.getUser(session.accessToken);
      if (error) {
        throw new SessionExpiredError({ originalError: error });
      }
    } catch (error) {
      Logger.error('Session validation failed', { error });
      throw error;
    }
  }

  /**
   * Revokes a token and adds it to the blacklist
   */
  public async revokeToken(token: string): Promise<void> {
    try {
      // Add to local blacklist
      await this.addToBlacklist(token);

      // Revoke on Supabase
      const { error } = await supabase.auth.signOut();
      if (error) throw error;

      Logger.info('Token revoked successfully');
    } catch (error) {
      Logger.error('Failed to revoke token', { error });
      throw new TokenRefreshError({ originalError: error });
    }
  }

  private async refreshSessionWithRetry(
    session: Session,
    attempt = 1
  ): Promise<void> {
    const maxRetries = 3;
    const baseDelay = 1000; // 1 second

    try {
      await this.refreshSession(session);
    } catch (error) {
      if (attempt <= maxRetries) {
        const delay = baseDelay * Math.pow(2, attempt - 1); // Exponential backoff
        Logger.warn(`Refresh attempt ${attempt} failed, retrying in ${delay}ms`, {
          error
        });
        
        await new Promise(resolve => setTimeout(resolve, delay));
        return this.refreshSessionWithRetry(session, attempt + 1);
      }
      throw error;
    }
  }

  // Session health monitoring
  private startHealthMonitoring(): void {
    setInterval(async () => {
      if (this.currentSession) {
        try {
          await this.validateSessionWithBackend(this.currentSession);
          Logger.debug('Session health check passed');
        } catch (error) {
          Logger.warn('Session health check failed', { error });
          await this.clearSession();
        }
      }
    }, 5 * 60 * 1000); // Check every 5 minutes
  }

  private async refreshSession(session: Session): Promise<void> {
    try {
      const { data, error } = await supabase.auth.refreshSession({
        refresh_token: session.refreshToken,
      });

      if (error) throw error;

      if (data.session) {
        const newSession: Session = {
          accessToken: data.session.access_token,
          refreshToken: data.session.refresh_token,
          expiresAt: Date.now() + (data.session.expires_in * 1000),
          userId: data.session.user.id,
          deviceId: session.deviceId, // Maintain device ID
          lastValidated: Date.now(),
          validationInterval: 5 * 60 * 1000, // Validate every 5 minutes
        };

        await this.setSession(newSession);
        Logger.info('Session refreshed successfully');
      } else {
        throw new Error('No session data received');
      }
    } catch (error) {
      Logger.error('Failed to refresh session', { error });
      throw new TokenRefreshError({ originalError: error });
    }
  }

  private scheduleTokenRefresh(session: Session): void {
    if (this.refreshTimeout) {
      clearTimeout(this.refreshTimeout);
    }

    // Schedule refresh 5 minutes before expiration
    const refreshTime = session.expiresAt - Date.now() - (5 * 60 * 1000);
    if (refreshTime > 0) {
      this.refreshTimeout = setTimeout(() => {
        this.refreshSession(session).catch(error => {
          Logger.error('Scheduled token refresh failed', { error });
        });
      }, refreshTime);
    }
  }

  private async updateSessionMetadata(): Promise<void> {
    if (!this.currentSession) return;

    try {
      const metadata: SessionMetadata = {
        lastActive: Date.now(),
        deviceInfo: {
          id: this.currentSession.deviceId,
          name: await this.getDeviceName(),
          platform: this.getPlatform(),
          lastLogin: Date.now(),
        },
      };

      await AsyncStorage.setItem(
        this.storageKeys.metadata,
        JSON.stringify(metadata)
      );

      // Update active sessions list
      await this.updateActiveSessions(metadata);
    } catch (error) {
      Logger.error('Failed to update session metadata', { error });
    }
  }

  private async updateActiveSessions(newMetadata: SessionMetadata): Promise<void> {
    try {
      const sessionsJson = await AsyncStorage.getItem(this.storageKeys.activeSessions);
      const sessions: Record<string, SessionMetadata> = sessionsJson 
        ? JSON.parse(sessionsJson)
        : {};

      // Update or add new session metadata
      sessions[newMetadata.deviceInfo.id] = newMetadata;

      // Remove expired sessions (inactive for more than 30 days)
      const thirtyDaysAgo = Date.now() - (30 * 24 * 60 * 60 * 1000);
      for (const [deviceId, metadata] of Object.entries(sessions)) {
        if (metadata.lastActive < thirtyDaysAgo) {
          delete sessions[deviceId];
        }
      }

      await AsyncStorage.setItem(
        this.storageKeys.activeSessions,
        JSON.stringify(sessions)
      );
    } catch (error) {
      Logger.error('Failed to update active sessions', { error });
    }
  }

  private async getDeviceName(): Promise<string> {
    // In a real app, you would use a library like react-native-device-info
    // For now, return a placeholder
    return 'Unknown Device';
  }

  private getPlatform(): string {
    // In a real app, you would use Platform.OS from react-native
    return 'unknown';
  }

  /**
   * Validates a JWT token's structure and signature
   */
  private async validateTokenStructure(token: string): Promise<boolean> {
    try {
      // Decode the token without verifying to check structure
      const decoded = jose.decodeJwt(token);
      
      if (!decoded || !decoded.exp || !decoded.iat || !decoded.sub) {
        Logger.warn('Invalid token structure', { decoded });
        return false;
      }

      // Check if token is expired
      const now = Math.floor(Date.now() / 1000);
      if (decoded.exp < now) {
        Logger.warn('Token is expired', {
          expiry: new Date(decoded.exp * 1000).toISOString()
        });
        return false;
      }

      // Check if token is blacklisted
      const isBlacklisted = await this.isTokenBlacklisted(token);
      if (isBlacklisted) {
        Logger.warn('Token is blacklisted');
        return false;
      }

      // Verify the user exists in the database
      try {
        const { data: user, error } = await supabase
          .from('users')
          .select('id')
          .eq('id', decoded.sub)
          .single();

        if (error || !user) {
          Logger.warn('User from token does not exist in database', {
            userId: decoded.sub,
            error
          });
          // Add token to blacklist since it references a non-existent user
          await this.addToBlacklist(token);
          return false;
        }
      } catch (error) {
        Logger.error('Error verifying user existence', { error });
        return false;
      }

      return true;
    } catch (error) {
      Logger.error('Token validation failed', { error });
      return false;
    }
  }

  /**
   * Extracts and returns metadata from a JWT token
   */
  private async getTokenMetadata(token: string): Promise<TokenMetadata | null> {
    try {
      const decoded = jose.decodeJwt(token);
      
      if (!decoded || !decoded.exp || !decoded.iat) {
        return null;
      }

      return {
        issuedAt: decoded.iat * 1000, // Convert to milliseconds
        expiresAt: decoded.exp * 1000,
        tokenType: decoded.typ as string || 'Bearer',
        scope: decoded.scope as string[] || undefined,
      };
    } catch (error) {
      Logger.error('Failed to extract token metadata', { error });
      return null;
    }
  }

  /**
   * Checks if a token is blacklisted
   */
  private async isTokenBlacklisted(token: string): Promise<boolean> {
    try {
      const blacklistJson = await AsyncStorage.getItem(this.storageKeys.tokenBlacklist);
      if (!blacklistJson) return false;

      const blacklist: Record<string, number> = JSON.parse(blacklistJson);
      const hashedToken = await this.hashToken(token);
      return !!blacklist[hashedToken];
    } catch (error) {
      Logger.error('Failed to check token blacklist', { error });
      return false;
    }
  }

  /**
   * Adds a token to the blacklist
   */
  private async addToBlacklist(token: string): Promise<void> {
    try {
      const metadata = await this.getTokenMetadata(token);
      if (!metadata) {
        throw new Error('Could not extract token metadata');
      }

      const blacklistJson = await AsyncStorage.getItem(this.storageKeys.tokenBlacklist);
      const blacklist: Record<string, number> = blacklistJson
        ? JSON.parse(blacklistJson)
        : {};

      // Store expiration time with hashed token
      const hashedToken = await this.hashToken(token);
      blacklist[hashedToken] = metadata.expiresAt;

      // Clean up expired entries
      const now = Date.now();
      for (const [hash, expiry] of Object.entries(blacklist)) {
        if (expiry < now) {
          delete blacklist[hash];
        }
      }

      await AsyncStorage.setItem(
        this.storageKeys.tokenBlacklist,
        JSON.stringify(blacklist)
      );
    } catch (error) {
      Logger.error('Failed to add token to blacklist', { error });
      throw error;
    }
  }

  /**
   * Creates a cryptographic hash of the token for storage
   */
  private async hashToken(token: string): Promise<string> {
    const data = new TextEncoder().encode(token);
    const hash = await Crypto.digest(
      Crypto.CryptoDigestAlgorithm.SHA256,
      data
    );
    return Buffer.from(hash).toString('base64');
  }

  /**
   * Cleans up expired tokens from the blacklist
   */
  private async cleanupBlacklist(): Promise<void> {
    try {
      const blacklistJson = await AsyncStorage.getItem(this.storageKeys.tokenBlacklist);
      if (!blacklistJson) return;

      const blacklist: Record<string, number> = JSON.parse(blacklistJson);
      const now = Date.now();
      let hasChanges = false;

      for (const [hash, expiry] of Object.entries(blacklist)) {
        if (expiry < now) {
          delete blacklist[hash];
          hasChanges = true;
        }
      }

      if (hasChanges) {
        await AsyncStorage.setItem(
          this.storageKeys.tokenBlacklist,
          JSON.stringify(blacklist)
        );
        Logger.info('Token blacklist cleaned up');
      }
    } catch (error) {
      Logger.error('Failed to cleanup token blacklist', { error });
    }
  }

  // Public methods

  public async setSession(session: Session): Promise<void> {
    try {
      await AsyncStorage.setItem(
        this.storageKeys.session,
        JSON.stringify(session)
      );
      this.currentSession = session;
      this.scheduleTokenRefresh(session);
      await this.updateSessionMetadata();
    } catch (error) {
      Logger.error('Failed to set session', { error });
      throw error;
    }
  }

  public async clearSession(clearBlacklist: boolean = false): Promise<void> {
    try {
      if (this.refreshTimeout) {
        clearTimeout(this.refreshTimeout);
      }
      
      const keysToRemove = [
        this.storageKeys.session,
        this.storageKeys.metadata,
      ];

      // Optionally clear the token blacklist
      if (clearBlacklist) {
        keysToRemove.push(this.storageKeys.tokenBlacklist);
      }
      
      await AsyncStorage.multiRemove(keysToRemove);
      
      this.currentSession = null;
      Logger.info('Session cleared successfully');
    } catch (error) {
      Logger.error('Failed to clear session', { error });
      throw error;
    }
  }

  public async getAccessToken(): Promise<string> {
    if (!this.currentSession) {
      throw new SessionExpiredError();
    }

    // Check if session needs refresh
    if (Date.now() >= this.currentSession.expiresAt) {
      await this.refreshSession(this.currentSession);
    }

    return this.currentSession.accessToken;
  }

  public async getActiveSessions(): Promise<SessionMetadata[]> {
    try {
      const sessionsJson = await AsyncStorage.getItem(this.storageKeys.activeSessions);
      const sessions: Record<string, SessionMetadata> = sessionsJson 
        ? JSON.parse(sessionsJson)
        : {};
      
      return Object.values(sessions);
    } catch (error) {
      Logger.error('Failed to get active sessions', { error });
      return [];
    }
  }

  public async revokeSession(deviceId: string): Promise<void> {
    try {
      // If revoking current device's session
      if (this.currentSession?.deviceId === deviceId) {
        await this.clearSession();
        return;
      }

      // Remove from active sessions
      const sessionsJson = await AsyncStorage.getItem(this.storageKeys.activeSessions);
      if (sessionsJson) {
        const sessions: Record<string, SessionMetadata> = JSON.parse(sessionsJson);
        delete sessions[deviceId];
        await AsyncStorage.setItem(
          this.storageKeys.activeSessions,
          JSON.stringify(sessions)
        );
      }
    } catch (error) {
      Logger.error('Failed to revoke session', { error });
      throw error;
    }
  }

  public isAuthenticated(): boolean {
    return this.currentSession !== null && Date.now() < this.currentSession.expiresAt;
  }
}

// Export a singleton instance
export const sessionManager = SessionManager.getInstance();
