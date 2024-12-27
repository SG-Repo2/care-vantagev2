import { Platform } from 'react-native';

export const firebaseConfig = {
  apiKey: process.env.FIREBASE_API_KEY,
  authDomain: process.env.FIREBASE_AUTH_DOMAIN,
  projectId: process.env.FIREBASE_PROJECT_ID,
  storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID,
  appId: Platform.select({
    ios: process.env.FIREBASE_APP_ID_IOS,
    android: process.env.FIREBASE_APP_ID_ANDROID,
  }),
  measurementId: process.env.FIREBASE_MEASUREMENT_ID,
};