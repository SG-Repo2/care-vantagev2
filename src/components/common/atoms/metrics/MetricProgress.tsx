import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { useTheme } from 'react-native-paper';
import Animated, { 
  useAnimatedStyle, 
  useAnimatedReaction,
  runOnJS,
  useSharedValue,
  withSpring
} from 'react-native-reanimated';
import { MetricColorKey } from '../../../../theme';

export interface MetricProgressProps {
  current: number;
  goal: number;
  type: MetricColorKey;
  color: string;
  width?: number;
  height?: number;
  style?: ViewStyle;
  progress?: Animated.SharedValue<number>;
}

export const MetricProgress: React.FC<MetricProgressProps> = ({
  current,
  goal,
  type,
  color,
  width = 120,
  height = 4,
  style,
  progress: externalProgress,
}) => {
  const theme = useTheme();
  const progress = useSharedValue(Math.min(current / goal, 1));

  const animatedStyle = useAnimatedStyle(() => ({
    width: `${progress.value * 100}%`
  }));

  useAnimatedReaction(
    () => externalProgress?.value ?? progress.value,
    (currentProgress) => {
      progress.value = currentProgress;
    },
    [externalProgress]
  );

  return (
    <View style={[styles.container, { width, height }, style]}>
      <View style={[styles.track, { backgroundColor: `${color}40` }]}>
        <Animated.View
          style={[
            styles.progress,
            { backgroundColor: color },
            animatedStyle,
          ]}
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    overflow: 'hidden',
  },
  track: {
    width: '100%',
    height: '100%',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progress: {
    height: '100%',
    borderRadius: 4,
  },
});