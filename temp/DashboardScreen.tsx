import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { View, ScrollView, StyleSheet } from 'react-native';
import { 
  Text, Avatar, 
  IconButton, Portal,
  useTheme, Appbar, Surface,
  Button, Dialog
} from 'react-native-paper';
import { useAuthContext } from '../features/auth/contexts/AuthContext';
import { StackNavigationProp } from '@react-navigation/stack';
import { MetricCard } from '../features/health/components/MetricCard';
import { RootStackParamList } from '../types/navigation';
import { HealthMetricType } from '../features/health/types';
import { useHealth } from '../features/health/contexts/HealthContext';
import { useFocusEffect } from '@react-navigation/native';
import { getMetricIcon } from '../features/health/utils/formatters';

type DashboardScreenProps = {
  navigation: StackNavigationProp<RootStackParamList, 'Dashboard'>;
};

const METRIC_TYPES: HealthMetricType[] = ['steps', 'heartRate', 'sleep'];

const DashboardScreen = ({ navigation }: DashboardScreenProps) => {
  const { currentUser } = useAuthContext();
  const { state: healthState, initialize, healthService } = useHealth();
  const theme = useTheme();
  const [showPermissionDialog, setShowPermissionDialog] = useState(false);
  const [isInitializing, setIsInitializing] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const today = useMemo(() => new Date(), []);
  const startOfDay = useMemo(() => {
    const date = new Date(today);
    date.setHours(0, 0, 0, 0);
    return date;
  }, [today]);

  // Initialize health service when component mounts
  useEffect(() => {
    let mounted = true;

    const initializeHealth = async () => {
      if (!healthState.isInitialized) {
        try {
          setIsInitializing(true);
          setError(null);
          const success = await initialize();
          if (mounted && !success) {
            setError('Failed to initialize health services');
          }
        } catch (err) {
          if (mounted) {
            console.error('Health initialization error:', err);
            setError('Failed to initialize health services');
          }
        } finally {
          if (mounted) {
            setIsInitializing(false);
          }
        }
      } else {
        setIsInitializing(false);
      }
    };

    initializeHealth();

    return () => {
      mounted = false;
    };
  }, [initialize, healthState.isInitialized]);

  useFocusEffect(
    useCallback(() => {
      if (!isInitializing && !error && (!healthState.isInitialized || !healthState.hasPermissions)) {
        setShowPermissionDialog(true);
      }
    }, [healthState.isInitialized, healthState.hasPermissions, isInitializing, error])
  );

  const handlePermissionRequest = async () => {
    try {
      setError(null);
      const granted = await healthService.requestPermissions();
      if (granted) {
        const success = await initialize();
        if (!success) {
          setError('Failed to initialize health services after permissions were granted');
        } else {
          setShowPermissionDialog(false);
        }
      }
    } catch (err) {
      console.error('Permission request error:', err);
      setError('Failed to request health permissions');
    }
  };

  const handleMetricPress = useCallback((metricType: HealthMetricType) => {
    navigation.navigate('MetricDetail', { metricType });
  }, [navigation]);

  const renderDashboard = useCallback(() => (
    <ScrollView style={styles.scrollView}>
      <Surface style={styles.welcomeCard} elevation={1}>
        <Avatar.Text 
          size={50} 
          label={currentUser?.displayName?.charAt(0) || '?'} 
          style={{ backgroundColor: theme.colors.primary }}
        />
        <View style={styles.welcomeText}>
          <Text variant="titleLarge" style={styles.text}>
            Hello, {currentUser?.displayName?.split(' ')[0] || 'User'}
          </Text>
          <Text variant="bodyMedium" style={styles.text}>
            {healthState.hasPermissions 
              ? "Let's stay healthy today!"
              : "Enable health tracking to get started"}
          </Text>
        </View>
      </Surface>

      {error ? (
        <Surface style={styles.errorCard} elevation={1}>
          <Text variant="titleMedium" style={styles.errorTitle}>
            Error
          </Text>
          <Text variant="bodyMedium" style={styles.errorText}>
            {error}
          </Text>
          <Button 
            mode="contained" 
            onPress={() => {
              setError(null);
              initialize();
            }}
            style={styles.retryButton}
          >
            Retry
          </Button>
        </Surface>
      ) : !healthState.hasPermissions && !isInitializing ? (
        <Surface style={styles.permissionCard} elevation={1}>
          <Text variant="titleMedium" style={styles.permissionTitle}>
            Enable Health Tracking
          </Text>
          <Text variant="bodyMedium" style={styles.permissionText}>
            To provide you with personalized health insights, we need access to your health data.
          </Text>
          <Button 
            mode="contained" 
            onPress={handlePermissionRequest}
            style={styles.permissionButton}
          >
            Enable Health Access
          </Button>
        </Surface>
      ) : (
        <View style={styles.metricsContainer}>
          {METRIC_TYPES.map((metricType) => (
            <MetricCard
              key={metricType}
              metricType={metricType}
              onPress={() => handleMetricPress(metricType)}
            />
          ))}
        </View>
      )}
    </ScrollView>
  ), [
    currentUser, 
    healthState.hasPermissions, 
    theme.colors.primary, 
    handleMetricPress, 
    isInitializing,
    error,
    initialize
  ]);

  return (
    <View style={styles.container}>
      <Appbar.Header>
        <Appbar.Content title="Health Dashboard" titleStyle={styles.text} />
        <IconButton 
          icon="cog" 
          onPress={() => navigation.navigate('Settings')}
          iconColor={theme.colors.primary}
        />
      </Appbar.Header>

      {renderDashboard()}

      <Portal>
        <Dialog visible={showPermissionDialog} dismissable={false}>
          <Dialog.Title>Welcome to Health Tracking</Dialog.Title>
          <Dialog.Content>
            <Text variant="bodyMedium">
              To provide you with personalized health insights and track your progress, 
              we need access to your health data. Your data will be kept private and secure.
            </Text>
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={handlePermissionRequest}>Enable Health Access</Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAFAFA',
  },
  scrollView: {
    flex: 1,
  },
  welcomeCard: {
    flexDirection: 'row',
    padding: 16,
    margin: 8,
    borderRadius: 12,
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
  },
  welcomeText: {
    marginLeft: 8,
  },
  text: {
    color: '#000000',
  },
  metricsContainer: {
    padding: 8,
  },
  permissionCard: {
    margin: 8,
    padding: 16,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
  },
  permissionTitle: {
    marginBottom: 8,
    color: '#000000',
  },
  permissionText: {
    marginBottom: 16,
    color: '#000000',
  },
  permissionButton: {
    marginTop: 8,
  },
  errorCard: {
    margin: 8,
    padding: 16,
    borderRadius: 12,
    backgroundColor: '#FFF0F0',
  },
  errorTitle: {
    marginBottom: 8,
    color: '#D32F2F',
  },
  errorText: {
    marginBottom: 16,
    color: '#D32F2F',
  },
  retryButton: {
    marginTop: 8,
    backgroundColor: '#D32F2F',
  }
});

export default DashboardScreen;
