import React, { useEffect } from 'react';
import auth from '@react-native-firebase/auth';
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
  useEffect(() => {
    const unsubscribe = auth().onAuthStateChanged((user) => {
      try {
        if (user) {
          console.log('User signed in:', user.uid);
        } else {
          console.log('User signed out');
        }
      } catch (error) {
        console.error('Auth state change error:', error);
      }
    });

    return () => unsubscribe();
  }, []);

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