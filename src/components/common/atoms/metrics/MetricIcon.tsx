import React from 'react';
import { StyleSheet, ViewStyle } from 'react-native';
import LottieView from 'lottie-react-native';
import Animated, { 
  useAnimatedProps,
  runOnJS,
  useSharedValue,
  useAnimatedReaction
} from 'react-native-reanimated';

import { MetricColorKey } from '../../../../theme';

const AnimatedLottieView = Animated.createAnimatedComponent(LottieView);

export interface MetricIconProps {
  type: MetricColorKey;
  size: number;
  color: string;
  progress?: Animated.SharedValue<number>;
  style?: ViewStyle;
}

export const MetricIcon: React.FC<MetricIconProps> = ({
  type,
  size,
  color,
  progress,
  style,
}) => {
  const localProgress = useSharedValue(0);
  const [animationProgress, setAnimationProgress] = React.useState(0);

  // Safely update animation progress from the UI thread
  const updateProgress = React.useCallback((value: number) => {
    setAnimationProgress(value);
  }, []);

  useAnimatedReaction(
    () => progress?.value ?? localProgress.value,
    (currentProgress) => {
      runOnJS(updateProgress)(currentProgress);
    },
    [progress, localProgress]
  );

  const animatedProps = useAnimatedProps(() => ({
    progress: animationProgress,
  }));

  const getLottieSource = () => {
    switch (type) {
      case 'steps':
        return require('../../../../assets/lottie/walking.json');
      case 'calories':
        return require('../../../../assets/lottie/fire.json');
      case 'distance':
        return require('../../../../assets/lottie/distance.json');
      default:
        return require('../../../../assets/lottie/walking.json');
    }
  };

  return (
    <AnimatedLottieView
      source={getLottieSource()}
      autoPlay
      loop
      style={[
        {
          width: size,
          height: size,
        },
        style,
      ]}
      animatedProps={animatedProps}
      colorFilters={[{
        keypath: "**",
        color: color
      }]}
    />
  );
};

const styles = StyleSheet.create({
  container: {
    aspectRatio: 1,
  },
});