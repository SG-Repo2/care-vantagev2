import { AppRegistry, Platform } from 'react-native';
import HealthMetricsApp from './src/health-metrics/App';

if (Platform.OS === 'android') {
AppRegistry.registerComponent('main', () => HealthMetricsApp);
} else {
AppRegistry.registerComponent('carevantage', () => HealthMetricsApp);
}

