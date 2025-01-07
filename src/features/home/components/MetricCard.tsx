import React, { useEffect } from 'react';
import { View } from 'react-native';
import { Text, useTheme } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import Animated, { 
  useAnimatedStyle, 
  useSharedValue, 
  withSpring,
  withTiming,
  useAnimatedProps,
  Easing
} from 'react-native-reanimated';
import LottieView from 'lottie-react-native';
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
  goal?: number;
}

const AnimatedLottieView = Animated.createAnimatedComponent(LottieView);

export const MetricCard: React.FC<MetricCardProps> = ({
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

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: withSpring(pressed.value ? 0.98 : 1, {
      damping: 10,
      stiffness: 100,
      mass: 1
    }) }]
  }));

  const animatedLottieProps = useAnimatedProps(() => {
    return {
      progress: progress.value
    };
  });

  useEffect(() => {
    const numericValue = typeof value === 'string' ? parseFloat(value.replace(/,/g, '')) : value;
    const targetProgress = Math.min(numericValue / goal, 1);
    
    progress.value = withTiming(targetProgress, {
      duration: 1000,
      easing: Easing.bezier(0.25, 0.1, 0.25, 1),
    });
  }, [value, goal]);

  const handlePress = () => {
    if (onPress) {
      onPress(getCurrentWeekStart());
    }
  };

  const getLottieSource = () => {
    switch (metricType) {
      case 'steps':
        return require('../../../assets/lottie/walking.json');
      case 'calories':
        return require('../../../assets/lottie/fire.json');
      case 'distance':
        return require('../../../assets/lottie/distance.json');
      default:
        return require('../../../assets/lottie/walking.json');
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
          <AnimatedLottieView
            source={getLottieSource()}
            autoPlay
            loop
            style={{ width: '100%', height: '100%' }}
            animatedProps={animatedLottieProps}
            colorFilters={[{
              keypath: "**",
              color: metricColor
            }]}
          />
        </View>
        <Text style={styles.value}>
          {value}
        </Text>
        <Text style={styles.title}>
          {title}
        </Text>
      </>
    );
  };

  return (
    <Animated.View style={[styles.container, animatedStyle]}>
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