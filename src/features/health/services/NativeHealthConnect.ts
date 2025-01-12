import {
  initialize,
  requestPermission,
  readRecords,
  type Permission,
  type WriteExerciseRoutePermission,
} from 'react-native-health-connect';

let isInitialized = false;

const initializeHealthConnect = async () => {
  if (!isInitialized) {
    try {
      await initialize();
      isInitialized = true;
    } catch (error) {
      console.error('Failed to initialize Health Connect:', error);
      throw error;
    }
  }
};

type HealthPermission = Permission | WriteExerciseRoutePermission;

const PERMISSIONS: HealthPermission[] = [
  { accessType: 'read', recordType: 'Steps' },
  { accessType: 'read', recordType: 'Distance' },
  { accessType: 'read', recordType: 'HeartRate' },
  { accessType: 'read', recordType: 'ActiveCaloriesBurned' },
  { accessType: 'read', recordType: 'TotalCaloriesBurned' },
];

interface TimeRange {
  startTime: string;
  endTime: string;
}

interface NativeHealthConnectInterface {
  isAvailable(): Promise<boolean>;
  requestPermissions(): Promise<boolean>;
  hasPermissions(): Promise<boolean>;
  getDailyMetrics(timeRange: TimeRange): Promise<{
    steps: number;
    distance: number;
    heartRate: number;
    calories: number;
  }>;
}

const NativeHealthConnect: NativeHealthConnectInterface = {
  isAvailable: async () => {
    try {
      await initializeHealthConnect();
      return true;
    } catch (error) {
      console.error('Health Connect availability check failed:', error);
      return false;
    }
  },

  requestPermissions: async () => {
    try {
      await initializeHealthConnect();
      const grantedPermissions = await requestPermission(PERMISSIONS);
      return grantedPermissions.length === PERMISSIONS.length;
    } catch (error) {
      console.error('Failed to request Health Connect permissions:', error);
      return false;
    }
  },

  hasPermissions: async () => {
    try {
      await initializeHealthConnect();
      const grantedPermissions = await requestPermission(PERMISSIONS);
      return grantedPermissions.length === PERMISSIONS.length;
    } catch (error) {
      console.error('Failed to check Health Connect permissions:', error);
      return false;
    }
  },

  getDailyMetrics: async ({ startTime, endTime }) => {
    try {
      await initializeHealthConnect();
      if (!(await NativeHealthConnect.hasPermissions())) {
        return { steps: 0, distance: 0, heartRate: 0, calories: 0 };
      }

      const timeRangeFilter = {
        operator: 'between' as const,
        startTime,
        endTime,
      };

      const [stepsResponse, distanceResponse, heartRateResponse, activeCaloriesResponse, totalCaloriesResponse] = await Promise.all([
        readRecords('Steps', { timeRangeFilter }),
        readRecords('Distance', { timeRangeFilter }),
        readRecords('HeartRate', { timeRangeFilter }),
        readRecords('ActiveCaloriesBurned', { timeRangeFilter }),
        readRecords('TotalCaloriesBurned', { timeRangeFilter }),
      ]);

      // Calculate total steps
      const steps = stepsResponse.records.reduce((total: number, record: any) => 
        total + (record.count || 0), 0);
      
      // Calculate total distance in meters
      const distance = distanceResponse.records.reduce((total: number, record: any) => 
        total + ((record.distance && record.distance.inMeters) || 0), 0);
      
      // Calculate average heart rate
      const heartRates = heartRateResponse.records.map((record: any) => record.beatsPerMinute || 0);
      const heartRate = heartRates.length 
        ? Math.round(heartRates.reduce((sum, rate) => sum + rate, 0) / heartRates.length)
        : 0;
      
      // Calculate total calories
      const activeCalories = activeCaloriesResponse.records.reduce(
        (total: number, record: any) => 
          total + ((record.energy && record.energy.inKilocalories) || 0), 
        0
      );
      
      const totalCalories = totalCaloriesResponse.records.reduce(
        (total: number, record: any) => 
          total + ((record.energy && record.energy.inKilocalories) || 0), 
        0
      );
      
      const calories = Math.round(activeCalories + totalCalories);

      return { steps, distance, heartRate, calories };
    } catch (error) {
      console.error('Failed to get daily metrics:', error);
      return { steps: 0, distance: 0, heartRate: 0, calories: 0 };
    }
  },
};

export default NativeHealthConnect;
