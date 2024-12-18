import { registerRootComponent } from 'expo';
import { Platform } from 'react-native';
import RNHealthKit from 'react-native-health';
import HealthConnect from '@stridekick/react-native-health-connect';

import App from './App';

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
  HealthConnect.isEnabled().then((isEnabled) => {
    if (isEnabled) {
      console.log('Health Connect is available');
      HealthConnect.authorize().then((authorized) => {
        if (authorized) {
          console.log('Health Connect permissions granted');
        } else {
          console.warn('Health Connect permissions not granted');
        }
      });
    } else {
      console.warn('Health Connect is not available');
    }
  }).catch((error) => {
    console.warn('Health Connect initialization error:', error);
  });
}

// registerRootComponent calls AppRegistry.registerComponent('main', () => App);
// It also ensures that whether you load the app in Expo Go or in a native build,
// the environment is set up appropriately
registerRootComponent(App);
