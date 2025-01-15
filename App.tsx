import React from 'react';
import { enableScreens } from 'react-native-screens';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { AppRegistry } from 'react-native';
import { HealthMetricsApp } from './src/health-metrics/App';

// Enable screens for better navigation performance
enableScreens();

function App() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <HealthMetricsApp />
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

AppRegistry.registerComponent('carevantage', () => App);

export default App;
