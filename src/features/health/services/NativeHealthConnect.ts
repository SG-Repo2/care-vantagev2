import { NativeModules } from 'react-native';

const { HealthConnectModule } = NativeModules;

if (!HealthConnectModule) {
  throw new Error(
    'HealthConnectModule is not available. Did you properly link the native module?'
  );
}

interface NativeHealthConnectInterface {
  isAvailable(): Promise<boolean>;
  requestPermissions(permissions: string[]): Promise<boolean>;
  getDailySteps(startTime: string, endTime: string): Promise<number>;
  getDailyDistance(startTime: string, endTime: string): Promise<number>;
  hasPermissions(permissions: string[]): Promise<boolean>;
}

const NativeHealthConnect: NativeHealthConnectInterface = {
  isAvailable: HealthConnectModule.isAvailable,
  requestPermissions: HealthConnectModule.requestPermissions,
  getDailySteps: HealthConnectModule.getDailySteps,
  getDailyDistance: HealthConnectModule.getDailyDistance,
  hasPermissions: HealthConnectModule.hasPermissions,
};

export default NativeHealthConnect;
