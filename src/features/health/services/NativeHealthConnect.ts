import { NativeModules } from 'react-native';

const { HealthConnectModule } = NativeModules;

if (!HealthConnectModule) {
  throw new Error(
    'HealthConnectModule is not available. Did you properly link the native module?'
  );
}

// Verify that all required methods are available
const requiredMethods = [
  'isAvailable',
  'requestPermissions',
  'hasPermissions',
  'getDailySteps',
  'getDailyDistance',
  'getDailyHeartRate'
] as const;

for (const method of requiredMethods) {
  if (typeof HealthConnectModule[method] !== 'function') {
    console.warn(`HealthConnectModule.${method} is not a function. Some features may not work.`);
  }
}

interface NativeHealthConnectInterface {
  isAvailable(): Promise<boolean>;
  requestPermissions(permissions: string[]): Promise<boolean>;
  getDailySteps(startTime: string, endTime: string): Promise<number>;
  getDailyDistance(startTime: string, endTime: string): Promise<number>;
  getDailyHeartRate(startTime: string, endTime: string): Promise<number>;
  hasPermissions(permissions: string[]): Promise<boolean>;
}

// Create a proxy to handle potential missing methods gracefully
const NativeHealthConnect: NativeHealthConnectInterface = new Proxy(
  {
    isAvailable: HealthConnectModule.isAvailable,
    requestPermissions: HealthConnectModule.requestPermissions,
    getDailySteps: HealthConnectModule.getDailySteps,
    getDailyDistance: HealthConnectModule.getDailyDistance,
    getDailyHeartRate: HealthConnectModule.getDailyHeartRate,
    hasPermissions: HealthConnectModule.hasPermissions,
  } as NativeHealthConnectInterface,
  {
    get: (target: NativeHealthConnectInterface, prop: keyof NativeHealthConnectInterface) => {
      if (!(prop in target)) {
        console.warn(`HealthConnectModule.${prop} is not available`);
        return async () => 0; // Return default value for missing methods
      }
      return target[prop];
    }
  }
);

export default NativeHealthConnect;
