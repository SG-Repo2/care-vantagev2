import { registerRootComponent } from 'expo';
import { Platform } from 'react-native';
import RNHealthKit from 'react-native-health';
import { initialize } from 'react-native-health-connect';
import App from './App';

// Immediately Invoked Function Expression (IIFE) for async initialization
(async () => {
  try {
    // Initialize Firebase first and wait for it

    
    // Initialize health services based on platform
    if (Platform.OS === 'android') {
      try {
        await initialize();
        console.log('Health Connect initialized successfully');
      } catch (error) {
        console.warn('Failed to initialize Health Connect:', error);
      }
    } else if (Platform.OS === 'ios') {
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
