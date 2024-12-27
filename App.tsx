import React, { useEffect, useState } from 'react';
import auth from '@react-native-firebase/auth';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { PaperProvider } from 'react-native-paper';
import { AppProvider } from './src/context/AppContext';
import { AuthProvider } from './src/features/auth/context/AuthContext';
import { RootNavigator } from './src/navigation/RootNavigator';
import { LogBox } from 'react-native';
import { initializeFirebase } from './src/config/firebase';

// Ignore specific warnings
LogBox.ignoreLogs([
  'Non-serializable values were found in the navigation state',
]);

export default function App() {
  const [authInitialized, setAuthInitialized] = useState(false);
  const [firebaseInitialized, setFirebaseInitialized] = useState(false);

  useEffect(() => {
    const init = async () => {
      try {
        await initializeFirebase();
        setFirebaseInitialized(true);
        setAuthInitialized(true);
      } catch (error) {
        console.error('Failed to initialize Firebase:', error);
      }
    };
    init();
  }, []);

  if (!firebaseInitialized) {
    return null; // or a loading spinner
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <PaperProvider>
        <AppProvider>
          <AuthProvider>
            <RootNavigator />
          </AuthProvider>
        </AppProvider>
      </PaperProvider>
    </GestureHandlerRootView>
  );
}
