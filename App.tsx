import { LogBox, Platform, NativeModules } from 'react-native';
import React, { useEffect, useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import { StyleSheet, Text, View, Alert } from 'react-native';
import AppleHealthKit, {
  HealthInputOptions,
  HealthKitPermissions,
  HealthValue
} from 'react-native-health';

const PERMS = AppleHealthKit.Constants?.Permissions;

// Properly type the permissions object
const healthKitOptions: HealthKitPermissions = {
  permissions: {
    read: [
      PERMS?.StepCount,
      PERMS?.Weight,
      PERMS?.Height,
      PERMS?.DateOfBirth,
      PERMS?.BodyMassIndex,
    ].filter(Boolean),
    write: [
      PERMS?.StepCount,
      PERMS?.Weight,
      PERMS?.BodyMassIndex,
    ].filter(Boolean),
  },
};

interface HealthData {
  steps: number;
}

interface StepCountResult extends HealthValue {
  value: number;
  startDate: string;
  endDate: string;
}

export default function App() {
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [healthData, setHealthData] = useState<HealthData>({ steps: 0 });
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const initializeHealthKit = async () => {
      try {
        if (Platform.OS !== 'ios') {
          throw new Error('HealthKit is only available on iOS');
        }

        // Initialize HealthKit
        AppleHealthKit.initHealthKit(healthKitOptions, (error: string) => {
          if (error) {
            setError(new Error(error));
            return;
          }
          
          setIsAuthorized(true);
          // After successful initialization, fetch health data
          fetchHealthData();
        });
      } catch (err) {
        setError(err instanceof Error ? err : new Error('Failed to initialize HealthKit'));
      }
    };

    initializeHealthKit();
  }, []);

  useEffect(() => {
    const fetchStepCount = async () => {
      if (!isAuthorized || Platform.OS !== 'ios') return;

      const stepOptions: HealthInputOptions = {
        startDate: new Date(new Date().setHours(0, 0, 0, 0)).toISOString(),
        endDate: new Date().toISOString(),
      };
      
      console.log('Fetching step count with options:', stepOptions);

      try {
        await new Promise((resolve, reject) => {
          AppleHealthKit.getStepCount(
            stepOptions,
            (err: string, results: StepCountResult) => {
              if (err) {
                console.error('Error getting steps:', err);
                reject(new Error(err));
                return;
              }
              
              console.log('Steps data received:', results);
              setHealthData({ steps: results?.value || 0 });
              resolve(results);
            }
          );
        });
      } catch (err) {
        const error = err instanceof Error ? err : new Error('Unknown error occurred');
        console.error('Step count error:', error);
        setError(error);
      }
    };

    fetchStepCount();
  }, [isAuthorized]);

  const fetchHealthData = async () => {
    const stepOptions: HealthInputOptions = {
      startDate: new Date(new Date().setHours(0, 0, 0, 0)).toISOString(),
      endDate: new Date().toISOString(),
    };
    
    console.log('Fetching step count with options:', stepOptions);

    try {
      await new Promise((resolve, reject) => {
        AppleHealthKit.getStepCount(
          stepOptions,
          (err: string, results: StepCountResult) => {
            if (err) {
              console.error('Error getting steps:', err);
              reject(new Error(err));
              return;
            }
            
            console.log('Steps data received:', results);
            setHealthData({ steps: results?.value || 0 });
            resolve(results);
          }
        );
      });
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Unknown error occurred');
      console.error('Step count error:', error);
      setError(error);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Health Data</Text>
      {Platform.OS !== 'ios' ? (
        <Text style={styles.error}>HealthKit is only available on iOS devices</Text>
      ) : (
        <>
          <Text style={styles.text}>Steps today: {healthData.steps}</Text>
          {error && (
            <View style={styles.errorContainer}>
              <Text style={styles.error}>{error.message}</Text>
              <Text style={styles.errorHint}>
                Please check your device settings to ensure HealthKit permissions are enabled.
              </Text>
            </View>
          )}
        </>
      )}
      <StatusBar style="auto" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  text: {
    fontSize: 18,
    marginBottom: 10,
  },
  errorContainer: {
    marginTop: 20,
    padding: 15,
    backgroundColor: '#ffebee',
    borderRadius: 8,
    width: '100%',
  },
  error: {
    color: '#d32f2f',
    textAlign: 'center',
    marginBottom: 8,
  },
  errorHint: {
    color: '#666',
    fontSize: 12,
    textAlign: 'center',
  }
});
