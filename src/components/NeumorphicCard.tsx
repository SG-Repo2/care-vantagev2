import React from 'react';
import { View, StyleSheet, ViewProps } from 'react-native';
import { BlurView } from '@react-native-community/blur';

interface NeumorphicCardProps extends ViewProps {
  children: React.ReactNode;
  intensity?: number;
}

export const NeumorphicCard: React.FC<NeumorphicCardProps> = ({
  children,
  intensity = 20,
  style,
  ...props
}) => {
  return (
    <View style={[styles.container, style]} {...props}>
      <BlurView
        style={styles.blur}
        blurType="light"
        blurAmount={intensity}
      />
      {children}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: 24,
    overflow: 'hidden',
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
  },
  blur: {
    ...StyleSheet.absoluteFillObject,
  },
});