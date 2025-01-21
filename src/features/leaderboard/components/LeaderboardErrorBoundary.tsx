import React, { ErrorInfo } from 'react';
import { View, StyleSheet } from 'react-native';
import { Text, Button } from 'react-native-paper';
import { ErrorBoundary } from '../../../core/error/ErrorBoundary';
import { Logger } from '../../../utils/error/Logger';
import { monitor } from '../../../utils/error/Monitor';

// Define leaderboard-specific error types
export class LeaderboardError extends Error {
  constructor(message: string, public code: string) {
    super(message);
    this.name = 'LeaderboardError';
  }
}

interface LeaderboardErrorBoundaryProps {
  children: React.ReactNode;
  onRetry?: () => void | Promise<void>;
}

export class LeaderboardErrorBoundary extends ErrorBoundary {
  constructor(props: LeaderboardErrorBoundaryProps) {
    super(props);
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Log with additional leaderboard context
    Logger.error('LeaderboardErrorBoundary caught an error:', {
      error,
      componentStack: errorInfo.componentStack,
      feature: 'leaderboard',
      timestamp: new Date().toISOString(),
    });

    // Add alert to monitoring system
    monitor.addAlert({
      severity: error instanceof LeaderboardError ? 'error' : 'critical',
      component: 'leaderboard',
      message: error.message,
      metadata: {
        errorInfo,
        errorCode: error instanceof LeaderboardError ? error.code : 'UNKNOWN',
      },
    });

    super.componentDidCatch(error, errorInfo);
  }

  private getErrorMessage(error: Error): string {
    if (error instanceof LeaderboardError) {
      switch (error.code) {
        case 'FETCH_FAILED':
          return 'Unable to load leaderboard data. Please check your internet connection and try again.';
        case 'AUTH_ERROR':
          return 'Your session has expired. Please sign in again.';
        case 'SUBSCRIPTION_ERROR':
          return 'Real-time updates are currently unavailable. Scores may be delayed.';
        default:
          return error.message;
      }
    }
    return 'An unexpected error occurred while loading the leaderboard.';
  }

  private handleRetry = async () => {
    const { onRetry } = this.props as LeaderboardErrorBoundaryProps;
    
    this.resetError();
    Logger.info('Leaderboard retry attempted', {
      previousError: this.state.error
    });
    
    this.resetError();
    onRetry?.();
  };

  render() {
    if (this.state.hasError) {
      return (
        <View style={styles.container}>
          <Text style={styles.title}>Leaderboard Error</Text>
          <Text style={styles.message}>
            {this.getErrorMessage(this.state.error!)}
          </Text>
          <Button 
            mode="contained" 
            onPress={this.handleRetry}
            style={styles.button}
          >
            Retry
          </Button>
        </View>
      );
    }

    return this.props.children;
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#f5f5f5',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#e53935', // Error red color
  },
  message: {
    textAlign: 'center',
    marginBottom: 20,
    color: '#424242',
  },
  button: {
    marginTop: 10,
    backgroundColor: '#2196f3', // Primary blue color
  },
});