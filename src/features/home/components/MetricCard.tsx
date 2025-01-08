import React, { useCallback, useMemo } from 'react';
import { View } from 'react-native';
import { Text, useTheme } from 'react-native-paper';
import { useSharedValue } from 'react-native-reanimated';
import { getMetricColor, MetricColorKey } from '../../../theme';
import { getCurrentWeekStart } from '../../../core/constants/metrics';
import { Card } from '../../../components/common/atoms/Card';
import { MetricIcon } from '../../../components/common/atoms/metrics/MetricIcon';
import { MetricValue } from '../../../components/common/atoms/metrics/MetricValue';
import { MetricProgress } from '../../../components/common/atoms/metrics/MetricProgress';
import { MetricProgressWheel } from '../../../components/common/atoms/metrics/MetricProgressWheel';
import { useStyles } from '../styles/MetricCard.styles';
import { layout } from '../constants/layout';

const ALL_METRIC_TYPES: MetricColorKey[] = ['steps', 'calories', 'distance'];

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
  goal = 10000,
}) => {
  const theme = useTheme();
  const styles = useStyles();
  const metricColor = getMetricColor(metricType);
  const progress = useSharedValue(0);

  // Randomly select a color from other metric types
  const alternateColor = useMemo(() => {
    const otherTypes = ALL_METRIC_TYPES.filter(type => type !== metricType);
    const randomType = otherTypes[Math.floor(Math.random() * otherTypes.length)];
    return getMetricColor(randomType);
  }, [metricType]);

  const handlePress = useCallback(() => {
    if (onPress) {
      onPress(getCurrentWeekStart());
    }
  }, [onPress]);

  if (loading) {
    return (
      <View style={styles.container}>
        <Card disabled>
          <Text style={styles.loadingText}>Loading...</Text>
        </Card>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.container}>
        <Card disabled>
          <Text style={styles.errorText}>{error}</Text>
        </Card>
      </View>
    );
  }

  const currentValue = typeof value === 'string' ? parseFloat(value.replace(/,/g, '')) : value;
  const progressValue = Math.min(currentValue / goal, 1);
  progress.value = progressValue;

  return (
    <View style={styles.container}>
      <Card
        onPress={handlePress}
        gradientColors={[metricColor, metricColor]}
        gradientStart={{ x: 0, y: 0 }}
        gradientEnd={{ x: 1, y: 1 }}
        testID={`metric-card-${metricType}`}
      >
        <View style={styles.content}>
          <View style={styles.progressWheelContainer}>
            <MetricProgressWheel
              size={layout.CARD_WIDTH * 0.7}
              strokeWidth={8}
              progress={progress}
              alternateColor={alternateColor}
            />
          </View>
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
          <Text style={styles.title}>
            {title}
          </Text>
        </View>
      </Card>
    </View>
  );
});
