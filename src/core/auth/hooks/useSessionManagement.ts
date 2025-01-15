import { useCallback, useRef, useState } from 'react';
import { Logger } from '../../../utils/error/Logger';
import { SessionExpiredError } from '../errors/AuthErrors';
import { authService } from '../services/AuthService';
import { User } from '../types/auth.types';

export interface UseSessionManagementReturn {
  refreshSession: () => Promise<User | null>;
  getAccessToken: () => Promise<string>;
  isRefreshing: boolean;
  isGettingToken: boolean;
}

export function useSessionManagement(
  userId?: string,
  onSessionRefreshed?: (user: User | null) => void
): UseSessionManagementReturn {
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isGettingToken, setIsGettingToken] = useState(false);
  const refreshInProgress = useRef(false);
  const tokenInProgress = useRef(false);

  const refreshSession = useCallback(async (): Promise<User | null> => {
    if (refreshInProgress.current) {
      Logger.info('Session refresh already in progress');
      return null;
    }

    refreshInProgress.current = true;
    setIsRefreshing(true);

    try {
      Logger.info('Starting session refresh', {
        userId,
        timestamp: new Date().toISOString()
      });

      const user = await authService.refreshSession();
      
      Logger.info('Session refresh successful', {
        userId: user?.id,
        timestamp: new Date().toISOString()
      });

      if (onSessionRefreshed) {
        onSessionRefreshed(user);
      }

      return user;
    } catch (error) {
      Logger.error('Session refresh failed:', {
        error,
        userId,
        timestamp: new Date().toISOString()
      });
      throw error;
    } finally {
      refreshInProgress.current = false;
      setIsRefreshing(false);
    }
  }, [userId, onSessionRefreshed]);

  const getAccessToken = useCallback(async (): Promise<string> => {
    if (tokenInProgress.current) {
      Logger.info('Token retrieval already in progress');
      // Wait for the existing operation to complete
      while (tokenInProgress.current) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }
      return authService.getAccessToken();
    }

    tokenInProgress.current = true;
    setIsGettingToken(true);

    try {
      Logger.info('Attempting to get access token', {
        userId,
        timestamp: new Date().toISOString(),
        context: 'tokenManagement'
      });

      const token = await authService.getAccessToken();
      
      if (!token) {
        throw new Error('No token returned from auth service');
      }

      Logger.info('Successfully retrieved access token', {
        userId,
        timestamp: new Date().toISOString(),
        context: 'tokenManagement',
        tokenExists: !!token
      });

      return token;
    } catch (error) {
      if (error instanceof SessionExpiredError) {
        Logger.info('Session expired, attempting token refresh', {
          userId,
          timestamp: new Date().toISOString(),
          context: 'tokenRefresh'
        });

        await refreshSession();
        const newToken = await authService.getAccessToken();

        Logger.info('Successfully refreshed token', {
          userId,
          timestamp: new Date().toISOString(),
          context: 'tokenRefresh',
          tokenExists: !!newToken
        });

        return newToken;
      }

      Logger.error('Failed to get access token', {
        error,
        userId,
        timestamp: new Date().toISOString(),
        context: 'tokenManagement'
      });

      throw error;
    } finally {
      tokenInProgress.current = false;
      setIsGettingToken(false);
    }
  }, [userId, refreshSession]);

  return {
    refreshSession,
    getAccessToken,
    isRefreshing,
    isGettingToken
  };
}