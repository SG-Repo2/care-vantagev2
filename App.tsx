import React from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { Provider as PaperProvider } from 'react-native-paper';
import { AppProvider } from './src/context/AppContext';
import { AuthProvider } from './src/context/AuthContext';
import { RootNavigator } from './src/navigation/RootNavigator';
import { useApp } from './src/context/AppContext';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { LogBox } from 'react-native';

// Ignore specific warnings
LogBox.ignoreLogs([
  'Sending `onAnimatedValueUpdate` with no listeners registered.',
  '-[RCTRootView cancelTouches]`',
]);

const AppContent = () => {
  const { theme, isLoading } = useApp();

  if (isLoading) {
    return null;
  }

  return (
    <PaperProvider theme={theme}>
      <RootNavigator />
    </PaperProvider>
  );
};

export default function App() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <AppProvider>
          <AuthProvider>
            <AppContent />
          </AuthProvider>
        </AppProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}