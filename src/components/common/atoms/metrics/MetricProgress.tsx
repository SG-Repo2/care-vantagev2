import React from 'react';
import { View, StyleSheet, Dimensions, ViewStyle } from 'react-native';
import { useTheme } from 'react-native-paper';
import { ProgressChart } from 'react-native-chart-kit';
import Animated, { 
  useAnimatedReaction,
  runOnJS,
  useSharedValue
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
  width = Dimensions.get('window').width * 0.3,
  height = 120,
  style,
  progress,
}) => {
  const theme = useTheme();
  const localProgress = useSharedValue(Math.min(current / goal, 1));
  const [chartProgress, setChartProgress] = React.useState(localProgress.value);

  // Safely update state from the UI thread
  const updateChartProgress = React.useCallback((value: number) => {
    setChartProgress(value);
  }, []);

  useAnimatedReaction(
    () => progress?.value ?? localProgress.value,
    (currentProgress) => {
      runOnJS(updateChartProgress)(currentProgress);
    },
    [progress, localProgress]
  );

  return (
    <View style={[styles.container, style]}>
      <ProgressChart
        data={{
          labels: ['Progress'],
          data: [chartProgress],
          colors: [color]
        }}
        width={width}
        height={height}
        chartConfig={{
          backgroundGradientFrom: theme.colors.surface,
          backgroundGradientTo: theme.colors.surface,
          color: (opacity = 1) => color,
          strokeWidth: 4,
          barPercentage: 0.5,
          useShadowColorFromDataset: false
        }}
        hideLegend
        withCustomBarColorFromData
        radius={32}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});