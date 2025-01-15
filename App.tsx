import React, { useEffect, useState } from 'react';
import { LogBox, View, Text } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { PaperProvider, ActivityIndicator, Button } from 'react-native-paper';
import 'react-native-reanimated';
import 'react-native-url-polyfill/auto';

import { AppProvider } from './src/context/AppContext';
import { AuthProvider } from './src/core/auth/contexts/AuthContext';
import { RootNavigator } from './src/navigation/RootNavigator';
import { ErrorBoundary } from './src/core/error/ErrorBoundary';
import { Logger } from './src/utils/error/Logger';

import { HealthProviderFactory } from './src/core/contexts/health/providers/HealthProviderFactory';
import { lightTheme } from './src/theme';
import { authService } from './src/core/auth/services/AuthService';

// Ignore specific warnings
LogBox.ignoreLogs([
  'Non-serializable values were found in the navigation state',
  'Setting a timer for a long period of time',
]);

export default function App() {
  const [isInitialized, setIsInitialized] = useState(false);
  const [initError, setInitError] = useState<Error | null>(null);

  useEffect(() => {
    const initializeApp = async () => {
      try {
        Logger.info('Starting app initialization...');
        
        // Initialize auth first
        await authService.initializeAuth();
        Logger.info('Auth initialized');
        
        // Initialize health provider
        await HealthProviderFactory.createProvider();
        Logger.info('Health provider initialized');
        
        setIsInitialized(true);
      } catch (error) {
        Logger.error('App initialization failed:', error);
        setInitError(error instanceof Error ? error : new Error('Initialization failed'));
      }
    };

    initializeApp();
    
    return () => {
      // Cleanup health provider on unmount
      HealthProviderFactory.cleanup().catch(error => {
        Logger.error('Health provider cleanup failed:', error);
      });
    };
  }, []);

  if (!isInitialized) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color={lightTheme.colors.primary} />
        {initError && (
          <View style={{ marginTop: 20, padding: 20, alignItems: 'center' }}>
            <Text style={{ color: 'red', marginBottom: 10, textAlign: 'center' }}>
              {initError.message}
            </Text>
            <Button
              mode="contained"
              onPress={() => window.location.reload()}
              style={{ marginTop: 10 }}
            >
              Retry
            </Button>
          </View>
        )}
      </View>
    );
  }

  const handleError = (error: Error, errorInfo: React.ErrorInfo) => {
    Logger.error('App level error:', {
      error,
      componentStack: errorInfo.componentStack,
      context: 'AppRoot'
    });
    
    // Reset initialization state on critical errors
    if (error.message.includes('initialization') || error.message.includes('auth')) {
      setIsInitialized(false);
      setInitError(error);
    }
  };

  return (
    <ErrorBoundary onError={handleError}>
      <GestureHandlerRootView style={{ flex: 1 }}>
        <PaperProvider theme={lightTheme}>
          <AppProvider>
            <AuthProvider>
              <ErrorBoundary
                onError={(error, errorInfo) => {
                  Logger.error('Navigation error:', {
                    error,
                    componentStack: errorInfo.componentStack,
                    context: 'Navigation'
                  });
                  
                  // Reset app state for auth-related navigation errors
                  if (error.message.toLowerCase().includes('auth')) {
                    setIsInitialized(false);
                    setInitError(error);
                  }
                }}
              >
                <RootNavigator />
              </ErrorBoundary>
            </AuthProvider>
          </AppProvider>
        </PaperProvider>
      </GestureHandlerRootView>
    </ErrorBoundary>
  );
}
