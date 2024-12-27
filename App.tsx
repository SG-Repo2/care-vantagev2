import React, { useEffect } from 'react';
import auth from '@react-native-firebase/auth';
import firebase from '@react-native-firebase/app';
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
    // Initialize Firebase if it hasn't been initialized yet
    if (!firebase.apps.length) {
      firebase.initializeApp({
        apiKey: "your-api-key",
        authDomain: "your-auth-domain",
        projectId: "your-project-id",
        storageBucket: "your-storage-bucket",
        messagingSenderId: "your-messaging-sender-id",
        appId: "your-app-id"
      });
    }

    // Initialize Firebase Auth
    const subscriber = auth().onAuthStateChanged(user => {
      console.log('Auth State Changed:', user ? 'User is signed in' : 'User is signed out');
    });

    // Unsubscribe on cleanup
    return subscriber;
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