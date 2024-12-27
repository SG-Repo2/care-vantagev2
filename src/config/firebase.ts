import { Platform } from 'react-native';
import firebase from '@react-native-firebase/app';
import Constants from 'expo-constants';

// Get the config from Expo constants
const getFirebaseConfig = () => {
  const config = Constants.expoConfig?.extra?.firebaseConfig;
  if (!config) {
    throw new Error('Firebase configuration is missing in app.config.js');
  }
  
  // Ensure appId is set based on platform
  const appId = Platform.select({
    ios: config.appId?.ios,
    android: config.appId?.android,
  });

  if (!appId) {
    throw new Error(`No Firebase App ID found for platform ${Platform.OS}`);
  }

  return {
    ...config,
    appId,
  };
};

export const initializeFirebase = () => {
  try {
    if (!firebase.apps.length) {
      firebase.initializeApp(getFirebaseConfig());
      console.log('Firebase initialized successfully');
    }
  } catch (error) {
    console.error('Firebase initialization failed:', error);
    throw error;
  }
};

export const getFirebaseApp = () => firebase.apps[0] ?? null;