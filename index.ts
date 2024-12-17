import { registerRootComponent } from 'expo';
import { Platform } from 'react-native';
import RNHealthKit from 'react-native-health';

import App from './App';

// Initialize HealthKit if on iOS
if (Platform.OS === 'ios') {
  // Ensure RNHealthKit is available
  if (RNHealthKit && typeof RNHealthKit.initHealthKit === 'function') {
    console.log('HealthKit is available');
  } else {
    console.warn('HealthKit is not properly initialized');
  }
}

// registerRootComponent calls AppRegistry.registerComponent('main', () => App);
// It also ensures that whether you load the app in Expo Go or in a native build,
// the environment is set up appropriately
registerRootComponent(App);
