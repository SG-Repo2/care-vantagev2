import React from 'react';
import { View } from 'react-native';
import { Text, useTheme } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';
import { getMetricColor, MetricColorKey } from '../../../theme';
import { getCurrentWeekStart } from '../../../core/constants/metrics';
import { Card } from '../../../components/common/atoms/Card';
import { useStyles } from '../styles/MetricCard.styles';

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
  const styles = useStyles();
  const metricColor = getMetricColor(metricType);
  const pressed = useSharedValue(false);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: withSpring(pressed.value ? 0.98 : 1, {
      damping: 10,
      stiffness: 100,
      mass: 1
    }) }]
  }));

  const handlePress = () => {
    if (onPress) {
      onPress(getCurrentWeekStart());
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
      <>
        <View style={styles.iconContainer}>
          <MaterialCommunityIcons
            name={icon}
            size={24}
            color={metricColor}
          />
        </View>
        <Text style={styles.value}>
          {value}
        </Text>
        <Text style={styles.title}>
          {title}
        </Text>
        <View style={styles.overlay} />
      </>
    );
  };

  return (
    <Animated.View style={[{ width: '100%' }, animatedStyle]}>
      <Card
        onPress={handlePress}
        disabled={loading || !!error}
        gradientColors={[metricColor, `${metricColor}80`]}
        gradientStart={{ x: 0, y: 0 }}
        gradientEnd={{ x: 1, y: 1 }}
      >
        <View style={styles.content}>
          {renderContent()}
        </View>
      </Card>
    </Animated.View>
  );
};