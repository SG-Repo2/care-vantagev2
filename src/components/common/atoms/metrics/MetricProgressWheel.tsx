import React from 'react';
import { View, StyleSheet } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import Animated, { useAnimatedProps } from 'react-native-reanimated';
import { MetricColorKey } from '../../../../theme';

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

interface MetricProgressWheelProps {
  size: number;
  strokeWidth?: number;
  progress?: Animated.SharedValue<number>;
  alternateColor: string;
}

export const MetricProgressWheel: React.FC<MetricProgressWheelProps> = ({
  size,
  strokeWidth = 12,
  progress,
  alternateColor,
}) => {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const center = size / 2;

  const animatedProps = useAnimatedProps(() => {
    const strokeDashoffset = circumference * (1 - (progress?.value ?? 0));
    return {
      strokeDashoffset,
    };
  });

  return (
    <View style={[styles.container, { width: size, height: size }]}>
      <Svg width={size} height={size}>
        {/* Background circle */}
        <Circle
          cx={center}
          cy={center}
          r={radius}
          stroke="rgba(255, 255, 255, 0.15)"
          strokeWidth={strokeWidth}
          fill="transparent"
        />
        {/* Progress circle */}
        <AnimatedCircle
          cx={center}
          cy={center}
          r={radius}
          stroke={alternateColor}
          strokeWidth={strokeWidth}
          fill="transparent"
          strokeDasharray={`${circumference} ${circumference}`}
          animatedProps={animatedProps}
          strokeLinecap="round"
        />
      </Svg>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    transform: [{ rotate: '-90deg' }],
  },
}); 