import firebase from '@react-native-firebase/app';
import firestore from '@react-native-firebase/firestore';
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

// Define the app type explicitly
type FirebaseApp = NonNullable<ReturnType<typeof firebase.app>>;
let app: FirebaseApp | null = null;

const getFirebaseConfig = (): FirebaseConfig => {
  console.log('Expo config:', Constants.expoConfig?.extra);
  const config = Constants.expoConfig?.extra?.firebaseConfig;
  
  if (!config) {
    console.error('Firebase configuration is missing. Constants.expoConfig:', Constants.expoConfig);
    throw new Error('Firebase configuration is missing in app.config.js');
  }
  
  // Remove undefined or null values from config
  const cleanConfig: FirebaseConfig = Object.entries(config).reduce((acc, [key, value]) => {
    if (value !== undefined && value !== null && value !== 'YOUR_MEASUREMENT_ID') {
      acc[key as keyof FirebaseConfig] = value as string;
    }
    return acc;
  }, {} as FirebaseConfig);
  
  return cleanConfig;
};

export const initializeFirebase = async (): Promise<FirebaseApp> => {
  try {
    if (!app) {
      console.log('Getting Firebase config...');
      const config = getFirebaseConfig();
      console.log('Firebase config:', { ...config, apiKey: '***' });

      if (firebase.apps.length === 0) {
        console.log('Initializing new Firebase app...');
        const newApp = await firebase.initializeApp(config);
        if (!newApp) {
          throw new Error('Failed to initialize Firebase app');
        }
        app = newApp;
      } else {
        console.log('Using existing Firebase app...');
        const existingApp = firebase.app();
        if (!existingApp) {
          throw new Error('Failed to get existing Firebase app');
        }
        app = existingApp;
      }
    }
    
    if (!app) {
      throw new Error('Firebase app is null after initialization');
    }
    
    console.log('Firebase initialization successful');
    return app;
  } catch (error) {
    console.error('Firebase initialization failed:', error);
    throw error;
  }
};

export const getFirebaseApp = async (): Promise<FirebaseApp> => {
  if (!app) {
    return await initializeFirebase();
  }
  return app;
};

export const getFirestore = () => {
  if (!app) {
    throw new Error('Firebase must be initialized before accessing Firestore');
  }
  return firestore();
};
