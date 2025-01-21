import React, { useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import Animated, {
  useAnimatedProps,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { MaterialCommunityIcons } from '@expo/vector-icons';

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

interface CircularProgressProps {
  size: number;
  strokeWidth?: number;
  progress?: number | Animated.SharedValue<number>;
  color?: string;
  showArrow?: boolean;
  duration?: number;
}

export const CircularProgress: React.FC<CircularProgressProps> = ({
  size,
  strokeWidth = 12,
  progress,
  color = '#20B2AA',
  showArrow = false,
  duration = 1500,
}) => {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const center = size / 2;
  
  const fill = useSharedValue(0);

  useEffect(() => {
    if (typeof progress === 'number') {
      fill.value = withTiming(progress, { duration });
    }
  }, [progress, duration]);

  const animatedProps = useAnimatedProps(() => {
    const currentProgress = typeof progress === 'number' 
      ? fill.value 
      : progress?.value ?? 0;
    
    return {
      strokeDasharray: [circumference * currentProgress, circumference],
    };
  });

  const circleProps = {
    cx: center,
    cy: center,
    r: radius,
    stroke: color,
    strokeWidth: strokeWidth,
    fill: 'transparent',
    strokeLinecap: 'round' as const,
  };

  return (
    <View style={[styles.container, { width: size, height: size }]}>
      <Svg width={size} height={size}>
        {/* Background circle */}
        <Circle
          {...circleProps}
          stroke={color}
          opacity={0.2}
        />
        {/* Progress circle */}
        <AnimatedCircle
          {...circleProps}
          animatedProps={animatedProps}
        />
      </Svg>
      {showArrow && (
        <MaterialCommunityIcons
          name="arrow-right"
          size={strokeWidth * 0.8}
          color="#fff"
          style={[
            styles.arrow,
            { top: strokeWidth * 0.1 }
          ]}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    transform: [{ rotate: '-90deg' }],
    alignSelf: 'center',
  },
  arrow: {
    position: 'absolute',
    alignSelf: 'center',
    transform: [{ rotate: '90deg' }],
  },
});