import React from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { PaperProvider } from 'react-native-paper';
import { AppProvider } from './src/context/AppContext';
import { AuthProvider } from './src/features/auth/context/AuthContext';
import { RootNavigator } from './src/navigation/RootNavigator';
import { LogBox } from 'react-native';

// Ignore specific warnings
LogBox.ignoreLogs([
  'Non-serializable values were found in the navigation state',
]);

export default function App() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <AppProvider>
        <AuthProvider>
          <PaperProvider>
            <RootNavigator />
          </PaperProvider>
        </AuthProvider>
      </AppProvider>
    </GestureHandlerRootView>
  );
}