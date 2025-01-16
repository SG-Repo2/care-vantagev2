import { AppRegistry } from 'react-native';
import { Platform } from 'react-native';
import RNHealthKit from 'react-native-health';
import { initialize } from 'react-native-health-connect';

import App from './src/health-metrics/App';

// Initialize health tracking based on platform
if (Platform.OS === 'ios') {
  // Initialize HealthKit
  if (RNHealthKit && typeof RNHealthKit.initHealthKit === 'function') {
    console.log('HealthKit is available');
  } else {
    console.warn('HealthKit is not properly initialized');
  }
} else if (Platform.OS === 'android') {
  // Initialize Health Connect
  initialize()
    .then((available) => {
      if (available) {
        console.log('Health Connect is available');
      } else {
        console.warn('Health Connect is not available');
      }
    })
    .catch((error) => {
      console.warn('Health Connect initialization error:', error);
    });
}

// Register with the name 'main' as expected by the app
AppRegistry.registerComponent('main', () => App);
