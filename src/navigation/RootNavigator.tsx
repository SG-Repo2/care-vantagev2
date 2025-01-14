import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useApp } from '../context/AppContext';
import { useAuth } from '../core/auth/contexts/AuthContext';
import { AppStack } from './AppStack';
import { AuthStack } from './AuthStack';
import { ActivityIndicator, View, StyleSheet } from 'react-native';
import { Text, Button } from 'react-native-paper';
import { ErrorBoundary } from '../core/error/ErrorBoundary';
import { Logger } from '../utils/error/Logger';

const LoadingScreen = () => {
  const { theme } = useApp();
  return (
    <View style={[styles.loadingContainer, { backgroundColor: theme.colors.background }]}>
      <ActivityIndicator size="large" color={theme.colors.primary} />
      <Text style={[styles.loadingText, { color: theme.colors.onBackground }]}>
        Loading...
      </Text>
    </View>
  );
};

const ErrorScreen = ({ error, onRetry }: { error: string; onRetry: () => void }) => {
  const { theme } = useApp();
  return (
    <View style={[styles.loadingContainer, { backgroundColor: theme.colors.background }]}>
      <Text style={[styles.errorText, { color: theme.colors.error }]}>
        Error: {error}
      </Text>
      <Button
        mode="contained"
        onPress={onRetry}
        style={styles.retryButton}
      >
        Retry
      </Button>
    </View>
  );
};

const Stack = createNativeStackNavigator();

export const RootNavigator = () => {
  const { theme } = useApp();
  const { user, isLoading, error, refreshSession } = useAuth();

  const handleNavigationStateChange = (state: any) => {
    Logger.info('Navigation state changed', {
      currentRoute: state?.routes?.[state.index]?.name,
      timestamp: new Date().toISOString(),
      context: 'navigation'
    });
  };

  const handleError = (error: Error, errorInfo: React.ErrorInfo) => {
    Logger.error('Navigation error:', {
      error,
      componentStack: errorInfo.componentStack,
      context: 'navigation',
      timestamp: new Date().toISOString()
    });
  };

  if (isLoading) {
    return <LoadingScreen />;
  }

  if (error) {
    return (
      <ErrorScreen
        error={error}
        onRetry={() => {
          Logger.info('Retrying after navigation error', {
            timestamp: new Date().toISOString(),
            context: 'navigation'
          });
          refreshSession();
        }}
      />
    );
  }

  return (
    <ErrorBoundary onError={handleError}>
      <NavigationContainer
        theme={theme}
        onStateChange={handleNavigationStateChange}
      >
        <Stack.Navigator screenOptions={{ headerShown: false }}>
          {user ? (
            <Stack.Screen
              name="App"
              component={AppStack}
              options={{ animation: 'fade' }}
              listeners={{
                focus: () => {
                  Logger.info('Navigated to App Stack', {
                    userId: user.id,
                    timestamp: new Date().toISOString(),
                    context: 'navigation'
                  });
                }
              }}
            />
          ) : (
            <Stack.Screen
              name="Auth"
              component={AuthStack}
              options={{ animation: 'fade' }}
              listeners={{
                focus: () => {
                  Logger.info('Navigated to Auth Stack', {
                    timestamp: new Date().toISOString(),
                    context: 'navigation'
                  });
                }
              }}
            />
          )}
        </Stack.Navigator>
      </NavigationContainer>
    </ErrorBoundary>
  );
};

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
  },
  errorText: {
    marginTop: 12,
    fontSize: 16,
    marginBottom: 20,
    textAlign: 'center',
    paddingHorizontal: 20,
  },
  retryButton: {
    marginTop: 16,
    minWidth: 120,
  },
});
