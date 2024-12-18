import { registerRootComponent } from 'expo';
import { Platform } from 'react-native';
import RNHealthKit from 'react-native-health';
import GoogleFit from 'react-native-google-fit';

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
  // Initialize Google Fit
  GoogleFit.checkIsAuthorized().then(() => {
    console.log('Google Fit is available');
  }).catch((error) => {
    console.warn('Google Fit initialization error:', error);
  });
}

// registerRootComponent calls AppRegistry.registerComponent('main', () => App);
// It also ensures that whether you load the app in Expo Go or in a native build,
// the environment is set up appropriately
registerRootComponent(App);
