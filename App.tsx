import React from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { PaperProvider } from 'react-native-paper';
import 'react-native-reanimated';
import { AppProvider } from './src/context/AppContext';
import { AuthProvider } from './src/core/auth/contexts/AuthContext';
import { UserProvider } from './src/context/UserContext';
import { RootNavigator } from './src/navigation/RootNavigator';
import { LogBox } from 'react-native';
import 'react-native-url-polyfill/auto';
import { lightTheme } from './src/theme';

// Ignore specific warnings
LogBox.ignoreLogs([
  'Non-serializable values were found in the navigation state',
]);

export default function App() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <PaperProvider theme={lightTheme}>
        <AppProvider>
          <AuthProvider>
            <UserProvider>
              <RootNavigator />
            </UserProvider>
          </AuthProvider>
        </AppProvider>
      </PaperProvider>
    </GestureHandlerRootView>
  );
}
