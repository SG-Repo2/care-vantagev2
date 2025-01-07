import React from 'react';
import { View, Pressable, StyleSheet } from 'react-native';
import { Text, useTheme } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';
import LinearGradient from 'react-native-linear-gradient';
import { getMetricColor, MetricColorKey } from '../../../theme';
import { getCurrentWeekStart } from '../../../core/constants/metrics';
import { Card } from '../../../components/common/atoms/Card';
import { spacing } from '../../../components/common/theme/spacing';

interface MetricCardProps {
  title: string;
  value: string | number;
  icon: keyof typeof MaterialCommunityIcons.glyphMap;
  metricType: MetricColorKey;
  onPress?: (startDate?: Date) => void;
  loading?: boolean;
  error?: string | null;
}

export const MetricCard: React.FC<MetricCardProps> = ({
  title,
  value,
  icon,
  metricType,
  onPress,
  loading,
  error,
}) => {
  const theme = useTheme();
  const metricColor = getMetricColor(metricType);
  const pressed = useSharedValue(false);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: withSpring(pressed.value ? 0.95 : 1, {
      damping: 10,
      stiffness: 100,
      mass: 1
    }) }]
  }));

  const handlePress = () => {
    console.log('Card pressed - metric:', metricType);
    if (onPress) {
      console.log('Calling onPress handler with startDate:', getCurrentWeekStart());
      onPress(getCurrentWeekStart());
    } else {
      console.warn('No onPress handler provided for metric:', metricType);
    }
  };

  const renderContent = () => {
    if (loading) {
      return <Text style={styles.loadingText}>Loading...</Text>;
    }

    if (error) {
      return <Text style={styles.errorText}>{error}</Text>;
    }

    return (
      <LinearGradient
        colors={[metricColor, `${metricColor}80`]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.gradient}
      >
        <MaterialCommunityIcons 
          name={icon} 
          size={32} 
          color={theme.colors.surface} 
        />
        <Text style={[styles.value, { color: theme.colors.surface }]}>
          {value}
        </Text>
        <Text style={[styles.title, { color: theme.colors.surface }]}>
          {title}
        </Text>
      </LinearGradient>
    );
  };

  return (
    <Animated.View style={[{ width: '100%' }, animatedStyle]}>
      <Card
        onPress={handlePress}
        disabled={loading || !!error}
        style={[
          styles.container,
          {
            borderColor: metricColor,
            backgroundColor: loading || error ? theme.colors.surface : 'transparent'
          }
        ]}
      >
        <View style={styles.content}>
          {renderContent()}
        </View>
      </Card>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    overflow: 'hidden',
    borderWidth: 0,
    borderRadius: 16,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.15,
    shadowRadius: 8,
  },
  content: {
    width: '100%',
    minHeight: 120,
  },
  gradient: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.md,
    minHeight: 120,
  },
  value: {
    marginTop: spacing.sm,
    fontSize: 28,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  title: {
    marginTop: spacing.xs,
    fontSize: 16,
    textAlign: 'center',
    opacity: 0.9,
  },
  errorText: {
    padding: spacing.md,
    color: 'error',
    textAlign: 'center',
  },
  loadingText: {
    padding: spacing.md,
    textAlign: 'center',
  },
});