import AsyncStorage from '@react-native-async-storage/async-storage';
import { Logger } from '@utils/error/Logger';
import { Session, SessionMetadata, StorageKeys } from './types';

export class SessionStorage {
  private readonly storageKeys: StorageKeys;

  constructor(storageKeys: StorageKeys) {
    this.storageKeys = storageKeys;
  }

  /**
   * Retrieves the stored session
   */
  public async getStoredSession(): Promise<Session | null> {
    try {
      const sessionJson = await AsyncStorage.getItem(this.storageKeys.session);
      return sessionJson ? JSON.parse(sessionJson) : null;
    } catch (error) {
      Logger.error('Failed to retrieve stored session', { error });
      return null;
    }
  }

  /**
   * Stores a session
   */
  public async setSession(session: Session): Promise<void> {
    try {
      await AsyncStorage.setItem(
        this.storageKeys.session,
        JSON.stringify(session)
      );
      Logger.info('Session stored successfully');
    } catch (error) {
      Logger.error('Failed to store session', { error });
      throw error;
    }
  }

  /**
   * Clears the current session and optionally the blacklist
   */
  public async clearSession(clearBlacklist: boolean = false): Promise<void> {
    try {
      const keysToRemove = [
        this.storageKeys.session,
        this.storageKeys.metadata,
      ];

      if (clearBlacklist) {
        keysToRemove.push(this.storageKeys.tokenBlacklist);
      }

      await AsyncStorage.multiRemove(keysToRemove);
      Logger.info('Session cleared successfully');
    } catch (error) {
      Logger.error('Failed to clear session', { error });
      throw error;
    }
  }

  /**
   * Updates session metadata
   */
  public async updateSessionMetadata(metadata: SessionMetadata): Promise<void> {
    try {
      await AsyncStorage.setItem(
        this.storageKeys.metadata,
        JSON.stringify(metadata)
      );

      // Update active sessions list
      await this.updateActiveSessions(metadata);
      Logger.debug('Session metadata updated');
    } catch (error) {
      Logger.error('Failed to update session metadata', { error });
      throw error;
    }
  }

  /**
   * Updates the list of active sessions
   */
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
      throw error;
    }
  }

  /**
   * Retrieves all active sessions
   */
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

  /**
   * Revokes a specific session by device ID
   */
  public async revokeSession(deviceId: string): Promise<void> {
    try {
      const sessionsJson = await AsyncStorage.getItem(this.storageKeys.activeSessions);
      if (sessionsJson) {
        const sessions: Record<string, SessionMetadata> = JSON.parse(sessionsJson);
        delete sessions[deviceId];
        await AsyncStorage.setItem(
          this.storageKeys.activeSessions,
          JSON.stringify(sessions)
        );
        Logger.info('Session revoked successfully', { deviceId });
      }
    } catch (error) {
      Logger.error('Failed to revoke session', { error });
      throw error;
    }
  }

  /**
   * Gets the current session metadata
   */
  public async getSessionMetadata(): Promise<SessionMetadata | null> {
    try {
      const metadataJson = await AsyncStorage.getItem(this.storageKeys.metadata);
      return metadataJson ? JSON.parse(metadataJson) : null;
    } catch (error) {
      Logger.error('Failed to get session metadata', { error });
      return null;
    }
  }
}