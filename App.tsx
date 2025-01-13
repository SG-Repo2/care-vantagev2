import React, { useEffect, useState } from 'react';
import { LogBox, View } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { PaperProvider, ActivityIndicator } from 'react-native-paper';
import 'react-native-reanimated';
import 'react-native-url-polyfill/auto';

import { AppProvider } from './src/context/AppContext';
import { AuthProvider } from './src/core/auth/contexts/AuthContext';
import { RootNavigator } from './src/navigation/RootNavigator';
import { ErrorHandlingService } from './src/services/error/ErrorHandlingService';
import { HealthProviderFactory } from './src/core/contexts/health/services/providers/HealthProviderFactory';
import { lightTheme } from './src/theme';

// Ignore specific warnings
LogBox.ignoreLogs([
  'Non-serializable values were found in the navigation state',
  'Setting a timer for a long period of time',
]);

export default function App() {
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    const initializeApp = async () => {
      try {
        // Set up error handlers first
        ErrorHandlingService.setupGlobalErrorHandlers();
        
        // Initialize other services as needed
        await HealthProviderFactory.createProvider();
        
        setIsInitialized(true);
      } catch (error) {
        console.error('App initialization error:', error);
        // Still mark as initialized to show the app even if some services fail
        setIsInitialized(true);
      }
    };

    initializeApp();

    // Cleanup function
    return () => {
      HealthProviderFactory.cleanup().catch(console.error);
    };
  }, []);

  if (!isInitialized) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color={lightTheme.colors.primary} />
      </View>
    );
  }

  return isInitialized ? (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <PaperProvider theme={lightTheme}>
        <AppProvider>
          <AuthProvider>
            <RootNavigator />
          </AuthProvider>
        </AppProvider>
      </PaperProvider>
    </GestureHandlerRootView>
  ) : null;
}
