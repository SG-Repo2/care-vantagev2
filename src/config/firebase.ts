import firebase from '@react-native-firebase/app';
import Constants from 'expo-constants';

type FirebaseConfig = {
  apiKey: string;
  authDomain: string;
  projectId: string;
  storageBucket: string;
  messagingSenderId: string;
  appId: string;
  measurementId?: string;
};

const getFirebaseConfig = (): FirebaseConfig => {
  const config = Constants.expoConfig?.extra?.firebaseConfig;
  
  if (!config) {
    throw new Error('Firebase configuration is missing in app.config.js');
  }
  
  return config;
};

export const initializeFirebase = () => {
  try {
    if (firebase.apps.length === 0) {
      const config = getFirebaseConfig();
      firebase.initializeApp(config);
    }
    return firebase.app();
  } catch (error) {
    console.error('Firebase initialization failed:', error);
    throw error;
  }
};

export const getFirebaseApp = () => {
  return firebase.app();
};

// Initialize Firebase when the module is imported
initializeFirebase();