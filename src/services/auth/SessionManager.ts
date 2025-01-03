import { Logger } from '../../utils/error/Logger';
import { SessionExpiredError, TokenRefreshError } from './AuthErrors';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '../../utils/supabase';

interface Session {
  accessToken: string;
  refreshToken: string;
  expiresAt: number; // Unix timestamp in milliseconds
  userId: string;
  deviceId: string;
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

export class SessionManager {
  private static instance: SessionManager;
  private currentSession: Session | null = null;
  private readonly sessionTimeoutMs = 30 * 60 * 1000; // 30 minutes
  private readonly storageKeys = {
    session: '@auth_session',
    metadata: '@session_metadata',
    activeSessions: '@active_sessions',
  };
  private refreshTimeout: NodeJS.Timeout | null = null;

  private constructor() {
    // Initialize session management
    this.initializeSession();
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
    
    // Check if session is expired
    if (now >= session.expiresAt) {
      // Attempt to refresh the session
      await this.refreshSession(session);
    } else {
      // Session is still valid, schedule refresh
      this.scheduleTokenRefresh(session);
      this.currentSession = session;
      await this.updateSessionMetadata();
    }
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

  public async clearSession(): Promise<void> {
    try {
      if (this.refreshTimeout) {
        clearTimeout(this.refreshTimeout);
      }
      
      await AsyncStorage.multiRemove([
        this.storageKeys.session,
        this.storageKeys.metadata,
      ]);
      
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
