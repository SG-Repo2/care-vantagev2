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
  getDailySteps(startTime: number, endTime: number): Promise<number>;
  getDailyDistance(startTime: number, endTime: number): Promise<number>;
}

const NativeHealthConnect: NativeHealthConnectInterface = {
  isAvailable: HealthConnectModule.isAvailable,
  requestPermissions: HealthConnectModule.requestPermissions,
  getDailySteps: HealthConnectModule.getDailySteps,
  getDailyDistance: HealthConnectModule.getDailyDistance,
};

export default NativeHealthConnect;
