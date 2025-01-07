import React, { useCallback, useEffect } from 'react';
import { View } from 'react-native';
import { Text, useTheme } from 'react-native-paper';
import Animated, { 
  useAnimatedStyle, 
  useSharedValue, 
  withSpring,
  withTiming,
  Easing,
  runOnJS
} from 'react-native-reanimated';
import { getMetricColor, MetricColorKey } from '../../../theme';
import { getCurrentWeekStart } from '../../../core/constants/metrics';
import { Card } from '../../../components/common/atoms/Card';
import { MetricIcon } from '../../../components/common/atoms/metrics/MetricIcon';
import { MetricValue } from '../../../components/common/atoms/metrics/MetricValue';
import { MetricProgress } from '../../../components/common/atoms/metrics/MetricProgress';
import { useStyles } from '../styles/MetricCard.styles';

interface MetricCardProps {
  title: string;
  value: string | number;
  icon: string;
  metricType: MetricColorKey;
  onPress?: (startDate?: Date) => void;
  loading?: boolean;
  error?: string | null;
  goal?: number;
}

export const MetricCard = React.memo<MetricCardProps>(({
  title,
  value,
  icon,
  metricType,
  onPress,
  loading,
  error,
  goal = 10000, // Default goal, especially for steps
}) => {
  const theme = useTheme();
  const styles = useStyles();
  const metricColor = getMetricColor(metricType);
  const pressed = useSharedValue(false);
  const progress = useSharedValue(0);

  const animatedStyle = useAnimatedStyle(() => {
    const scale = withSpring(pressed.value ? 0.98 : 1, {
      damping: 15,
      stiffness: 150,
      mass: 1,
      overshootClamping: true,
      restSpeedThreshold: 0.1,
      restDisplacementThreshold: 0.1
    });

    return {
      transform: [{ scale }]
    };
  });

  // Update progress with proper worklet
  useEffect(() => {
    const numericValue = typeof value === 'string' ? parseFloat(value.replace(/,/g, '')) : value;
    const targetProgress = Math.min(numericValue / goal, 1);
    
    progress.value = withTiming(targetProgress, {
      duration: 1000,
      easing: Easing.bezier(0.25, 0.1, 0.25, 1),
    });
  }, [value, goal]);

  const handlePress = useCallback(() => {
    if (onPress) {
      onPress(getCurrentWeekStart());
    }
  }, [onPress]);

  const renderContent = useCallback(() => {
    if (loading) {
      return <Text style={styles.loadingText}>Loading...</Text>;
    }

    if (error) {
      return <Text style={styles.errorText}>{error}</Text>;
    }

    return (
      <>
        <View style={styles.iconContainer}>
          <MetricIcon
            type={metricType}
            size={styles.iconContainer.width}
            color={metricColor}
            progress={progress}
          />
        </View>
        <MetricValue
          value={value}
          type={metricType}
          style={styles.value}
        />
        <View style={styles.chartContainer}>
          <MetricProgress
            current={typeof value === 'string' ? parseFloat(value.replace(/,/g, '')) : value}
            goal={goal}
            type={metricType}
            color={metricColor}
            progress={progress}
          />
        </View>
        <Text style={styles.title}>
          {title}
        </Text>
      </>
    );
  }, [loading, error, metricType, metricColor, value, goal, styles, title, progress]);

  return (
    <Animated.View style={[styles.container, animatedStyle]}>
      <Card
        onPress={handlePress}
        disabled={loading || !!error}
        gradientColors={[metricColor, `${metricColor}80`]}
        gradientStart={{ x: 0, y: 0 }}
        gradientEnd={{ x: 1, y: 1 }}
        testID={`metric-card-${metricType}`}
      >
        <View style={styles.content}>
          {renderContent()}
        </View>
      </Card>
    </Animated.View>
  );
}, (prevProps, nextProps) => {
  // Implement deep comparison for complex props
  return (
    prevProps.value === nextProps.value &&
    prevProps.loading === nextProps.loading &&
    prevProps.error === nextProps.error &&
    prevProps.goal === nextProps.goal &&
    prevProps.title === nextProps.title &&
    prevProps.metricType === nextProps.metricType
  );
});