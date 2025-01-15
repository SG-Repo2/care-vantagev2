import { Logger } from '@utils/error/Logger';
import { supabase } from '@utils/supabase';
import { Session, SessionRefreshOptions } from './types';
import { TokenRefreshError } from '@core/auth/errors/AuthErrors';

export class SessionRefresher {
  private readonly defaultOptions: Required<SessionRefreshOptions> = {
    maxRetries: 3,
    baseDelay: 1000,
    force: false
  };

  /**
   * Refreshes a session with retry logic
   */
  public async refreshWithRetry(
    session: Session,
    options: SessionRefreshOptions = {}
  ): Promise<Session> {
    const { maxRetries, baseDelay, force } = {
      ...this.defaultOptions,
      ...options
    };

    let lastError: Error | null = null;
    let attempt = 1;

    while (attempt <= maxRetries) {
      try {
        // Only force refresh or refresh if session is expired/near expiry
        if (force || this.shouldRefresh(session)) {
          return await this.refreshSession(session);
        }
        return session;
      } catch (error) {
        lastError = error as Error;
        Logger.warn(`Refresh attempt ${attempt} failed`, { error });

        if (attempt < maxRetries) {
          const delay = baseDelay * Math.pow(2, attempt - 1); // Exponential backoff
          await this.delay(delay);
          attempt++;
        } else {
          break;
        }
      }
    }

    throw new TokenRefreshError({
      message: `Failed to refresh session after ${maxRetries} attempts`,
      originalError: lastError
    });
  }

  /**
   * Performs the actual session refresh
   */
  private async refreshSession(session: Session): Promise<Session> {
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
          validationInterval: session.validationInterval,
          user: data.session.user
        };

        Logger.info('Session refreshed successfully');
        return newSession;
      } else {
        throw new Error('No session data received');
      }
    } catch (error) {
      Logger.error('Failed to refresh session', { error });
      throw new TokenRefreshError({ originalError: error });
    }
  }

  /**
   * Determines if a session needs to be refreshed
   */
  private shouldRefresh(session: Session): boolean {
    const refreshThreshold = 5 * 60 * 1000; // 5 minutes before expiry
    return Date.now() + refreshThreshold >= session.expiresAt;
  }

  /**
   * Schedules the next token refresh
   */
  public scheduleRefresh(
    session: Session,
    onRefresh: (newSession: Session) => Promise<void>
  ): NodeJS.Timeout {
    const refreshTime = session.expiresAt - Date.now() - (5 * 60 * 1000);
    
    if (refreshTime <= 0) {
      // If already expired or very close to expiry, refresh immediately
      this.refreshWithRetry(session)
        .then(onRefresh)
        .catch(error => {
          Logger.error('Immediate refresh failed', { error });
        });
      return setTimeout(() => {}, 0);
    }

    return setTimeout(async () => {
      try {
        const newSession = await this.refreshWithRetry(session);
        await onRefresh(newSession);
      } catch (error) {
        Logger.error('Scheduled refresh failed', { error });
      }
    }, refreshTime);
  }

  /**
   * Utility method to create a delay
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}