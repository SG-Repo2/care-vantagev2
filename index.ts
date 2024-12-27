import { registerRootComponent } from 'expo';
import { Platform } from 'react-native';
import RNHealthKit from 'react-native-health';
import App from './App';

// Immediately Invoked Function Expression (IIFE) for async initialization
(async () => {
  try {
    // Initialize Firebase first and wait for it

    
    // Initialize HealthKit if on iOS
    if (Platform.OS === 'ios') {
      if (RNHealthKit && typeof RNHealthKit.initHealthKit === 'function') {
        console.log('HealthKit is available');
      } else {
        console.warn('HealthKit is not properly initialized');
      }
    }
  } catch (error) {
    console.error('Failed to initialize Firebase:', error);
  }
})();

registerRootComponent(App);