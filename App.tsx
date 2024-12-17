import { LogBox, Platform, NativeModules } from 'react-native';
import React, { useEffect, useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import { StyleSheet, Text, View } from 'react-native';
import AppleHealthKit, {
  HealthInputOptions,
  HealthKitPermissions,
  HealthValue
} from 'react-native-health';

const PERMS = AppleHealthKit.Constants?.Permissions;

// Check if HealthKit is available
const IS_HEALTHKIT_AVAILABLE = AppleHealthKit.isAvailable;

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
  const [isLoading, setIsLoading] = useState(true);
  const [isHealthKitAvailable, setIsHealthKitAvailable] = useState(false);

  // Check HealthKit availability
  useEffect(() => {
    if (Platform.OS !== 'ios') {
      setError(new Error('HealthKit is only available on iOS'));
      setIsLoading(false);
      return;
    }

    if (!IS_HEALTHKIT_AVAILABLE) {
      setError(new Error('HealthKit is not available on this device'));
      setIsLoading(false);
      return;
    }

    setIsHealthKitAvailable(true);
  }, []);

  const fetchHealthData = async () => {
    if (!isAuthorized || !isHealthKitAvailable) return;

    const options = {
      date: new Date().toISOString(),
      includeManuallyAdded: true
    };

    try {
      await new Promise((resolve, reject) => {
        if (!AppleHealthKit.getStepCount) {
          reject(new Error('HealthKit step count method not available'));
          return;
        }

        AppleHealthKit.getStepCount(options, (err: string, results: StepCountResult) => {
          if (err) {
            console.error('Error fetching step count:', err);
            reject(new Error(err));
            return;
          }
          
          if (!results) {
            reject(new Error('No step count data available'));
            return;
          }
          
          setHealthData({ steps: results.value || 0 });
          resolve(results);
        });
      });
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to fetch step count'));
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const initializeHealthKit = async () => {
      console.log('Starting HealthKit initialization...'); // Debug log
      if (!isHealthKitAvailable) {
        console.log('HealthKit is not available on this device'); // Debug log
        return;
      } 

      try {
        console.log('HealthKit permissions:', healthKitOptions); // Debug log
        if (!healthKitOptions.permissions.read.length && !healthKitOptions.permissions.write.length) {
          throw new Error('No HealthKit permissions specified');
        }

        AppleHealthKit.initHealthKit(healthKitOptions, (error: string) => {
          if (error) {
            console.log('HealthKit initialization error:', error); // Debug log
            setError(new Error(`HealthKit initialization failed: ${error}`));
            setIsLoading(false);
            return;
          }
          
          setIsAuthorized(true);
          fetchHealthData();
        });
      } catch (err) {
        setError(err instanceof Error ? err : new Error('Failed to initialize HealthKit'));
        setIsLoading(false);
      }
    };

    initializeHealthKit();
  }, [isHealthKitAvailable]);

  // Set up periodic refresh of health data
  useEffect(() => {
    if (!isAuthorized || !isHealthKitAvailable) return;

    const refreshInterval = setInterval(fetchHealthData, 300000); // Refresh every 5 minutes
    return () => clearInterval(refreshInterval);
  }, [isAuthorized, isHealthKitAvailable]);

  return (
    <View style={styles.container}>
      <StatusBar style="auto" />
      {isLoading ? (
        <Text style={styles.message}>Loading health data...</Text>
      ) : error ? (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Error: {error.message}</Text>
        </View>
      ) : (
        <View style={styles.dataContainer}>
          <Text style={styles.title}>Today's Health Data</Text>
          <View style={styles.statsContainer}>
            <View style={styles.statBox}>
              <Text style={styles.statValue}>{healthData.steps}</Text>
              <Text style={styles.statLabel}>Steps</Text>
            </View>
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  message: {
    fontSize: 18,
    color: '#666',
  },
  errorContainer: {
    padding: 20,
    backgroundColor: '#ffebee',
    borderRadius: 8,
  },
  errorText: {
    color: '#c62828',
    fontSize: 16,
  },
  dataContainer: {
    width: '100%',
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    color: '#333',
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    flexWrap: 'wrap',
    gap: 20,
  },
  statBox: {
    backgroundColor: '#f5f5f5',
    padding: 20,
    borderRadius: 12,
    alignItems: 'center',
    minWidth: 150,
  },
  statValue: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#2196f3',
  },
  statLabel: {
    fontSize: 16,
    color: '#666',
    marginTop: 8,
  },
});
