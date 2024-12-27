import { Platform } from 'react-native';
import firebase from '@react-native-firebase/app';
import Constants from 'expo-constants';

type FirebaseConfig = {
  apiKey: string;
  authDomain: string;
  projectId: string;
  storageBucket: string;
  messagingSenderId: string;
  appId: string;
};

// Get the config from Expo constants
const getFirebaseConfig = (): FirebaseConfig => {
  const config = Constants.expoConfig?.extra?.firebaseConfig;
  if (!config) {
    throw new Error('Firebase configuration is missing in app.config.js');
  }

  // Get platform-specific app ID
  const appId = Platform.OS === 'android'
    ? process.env.FIREBASE_APP_ID_ANDROID
    : process.env.FIREBASE_APP_ID_IOS;

  if (!appId) {
    throw new Error(`No Firebase App ID found for platform ${Platform.OS}`);
  }

  return {
    ...config,
    appId
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