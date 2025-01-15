import { Logger } from '@utils/error/Logger';
import { SessionExpiredError } from '@core/auth/errors/AuthErrors';
import { Session, SessionEvent, SessionMetadata, StorageKeys, SessionManagerConfig } from './session/types';
import { TokenValidator } from './session/TokenValidator';
import { SessionStorage } from './session/SessionStorage';
import { SessionRefresher } from './session/SessionRefresher';

export class SessionManager {
  private static instance: SessionManager;
  private currentSession: Session | null = null;
  private refreshTimeout: NodeJS.Timeout | null = null;
  private eventListeners: Map<SessionEvent['type'], Set<Function>> = new Map();

  private readonly config: SessionManagerConfig = {
    sessionTimeoutMs: 30 * 60 * 1000, // 30 minutes
    validationIntervalMs: 5 * 60 * 1000, // 5 minutes
    refreshBeforeExpiryMs: 5 * 60 * 1000, // 5 minutes
    maxRefreshRetries: 3,
    baseRefreshDelayMs: 1000
  };

  private readonly storageKeys: StorageKeys = {
    session: '@auth_session',
    metadata: '@session_metadata',
    activeSessions: '@active_sessions',
    tokenBlacklist: '@token_blacklist'
  };

  private readonly tokenValidator: TokenValidator;
  private readonly sessionStorage: SessionStorage;
  private readonly sessionRefresher: SessionRefresher;

  private constructor() {
    this.tokenValidator = new TokenValidator(this.storageKeys);
    this.sessionStorage = new SessionStorage(this.storageKeys);
    this.sessionRefresher = new SessionRefresher();

    // Initialize session management
    this.initializeSession();
    
    // Start periodic cleanup of blacklist
    setInterval(() => {
      this.tokenValidator.cleanupBlacklist().catch(error => {
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

  private async initializeSession(): Promise<void> {
    try {
      const storedSession = await this.sessionStorage.getStoredSession();
      if (storedSession) {
        await this.verifyAndRefreshSession(storedSession);
      }
    } catch (error) {
      Logger.error('Failed to initialize session', { error });
      await this.clearSession();
    }
  }

  private async verifyAndRefreshSession(session: Session): Promise<void> {
    const now = Date.now();
    let needsRefresh = false;
    
    try {
      // Always validate token first
      const validationResult = await this.tokenValidator.validateToken(session.accessToken);
      if (!validationResult.isValid) {
        needsRefresh = true;
        Logger.info('Token validation failed, attempting refresh', {
          error: validationResult.error,
          sessionId: session.deviceId
        });
      }

      // Check if approaching expiry
      const timeUntilExpiry = session.expiresAt - now;
      if (timeUntilExpiry <= this.config.refreshBeforeExpiryMs) {
        needsRefresh = true;
        Logger.info('Session approaching expiry, initiating refresh', {
          timeUntilExpiry,
          sessionId: session.deviceId
        });
      }

      if (needsRefresh) {
        const newSession = await this.sessionRefresher.refreshWithRetry(session, {
          maxRetries: this.config.maxRefreshRetries,
          baseDelay: this.config.baseRefreshDelayMs,
          onRetry: (attempt, delay) => {
            Logger.info('Retrying session refresh', {
              attempt,
              nextRetryIn: delay,
              sessionId: session.deviceId
            });
          }
        });

        this.currentSession = newSession;
        await this.updateSessionState(newSession);
        this.emitEvent('session-renewed');
      } else {
        // Update last validated time if no refresh needed
        session.lastValidated = now;
        await this.updateSessionState(session);
      }
    } catch (error) {
      Logger.error('Session verification/refresh failed', {
        error,
        sessionId: session.deviceId
      });
      
      // Clean up and propagate error
      await this.clearSession();
      this.emitEvent('session-error', error instanceof Error ? error : new Error('Session refresh failed'));
      throw error;
    }
  }

  private async updateSessionState(session: Session): Promise<void> {
    // Update storage
    await this.sessionStorage.setSession(session);

    // Schedule next refresh
    if (this.refreshTimeout) {
      clearTimeout(this.refreshTimeout);
    }

    this.refreshTimeout = this.sessionRefresher.scheduleRefresh(
      session,
      async (newSession: Session) => {
        this.currentSession = newSession;
        await this.updateSessionState(newSession);
        this.emitEvent('session-renewed');
      }
    );

    // Update metadata
    const metadata: SessionMetadata = {
      lastActive: Date.now(),
      deviceInfo: {
        id: session.deviceId,
        name: 'Unknown Device', // This should be implemented with react-native-device-info
        platform: 'unknown', // This should be implemented with Platform.OS
        lastLogin: Date.now()
      }
    };

    await this.sessionStorage.updateSessionMetadata(metadata);
  }

  // Event handling
  private emitEvent(type: SessionEvent['type'], error?: Error): void {
    const listeners = this.eventListeners.get(type);
    if (listeners) {
      const event: SessionEvent = {
        type,
        timestamp: Date.now(),
        sessionId: this.currentSession?.deviceId,
        error
      };
      listeners.forEach(listener => listener(event));
    }
  }

  // Public methods

  public async setSession(session: Session): Promise<void> {
    try {
      await this.updateSessionState(session);
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

      if (this.currentSession?.accessToken) {
        await this.tokenValidator.addToBlacklist(this.currentSession.accessToken);
      }

      await this.sessionStorage.clearSession(clearBlacklist);
      this.currentSession = null;
      this.emitEvent('session-expired');
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

    try {
      const validationResult = await this.tokenValidator.validateToken(this.currentSession.accessToken);
      if (!validationResult.isValid) {
        // Attempt to refresh the session
        const newSession = await this.sessionRefresher.refreshWithRetry(this.currentSession);
        await this.updateSessionState(newSession);
        return newSession.accessToken;
      }

      return this.currentSession.accessToken;
    } catch (error) {
      Logger.error('Failed to get access token', { error });
      throw error;
    }
  }

  public async getActiveSessions(): Promise<SessionMetadata[]> {
    return this.sessionStorage.getActiveSessions();
  }

  public async revokeSession(deviceId: string): Promise<void> {
    try {
      if (this.currentSession?.deviceId === deviceId) {
        await this.clearSession();
        return;
      }

      await this.sessionStorage.revokeSession(deviceId);
    } catch (error) {
      Logger.error('Failed to revoke session', { error });
      throw error;
    }
  }

  public isAuthenticated(): boolean {
    return this.currentSession !== null && Date.now() < this.currentSession.expiresAt;
  }

  public addEventListener(type: SessionEvent['type'], listener: Function): void {
    let listeners = this.eventListeners.get(type);
    if (!listeners) {
      listeners = new Set();
      this.eventListeners.set(type, listeners);
    }
    listeners.add(listener);
  }

  public removeEventListener(type: SessionEvent['type'], listener: Function): void {
    const listeners = this.eventListeners.get(type);
    if (listeners) {
      listeners.delete(listener);
    }
  }
}

// Export a singleton instance
export const sessionManager = SessionManager.getInstance();
