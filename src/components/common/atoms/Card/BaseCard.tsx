import React from 'react';
import { Pressable, StyleProp, ViewStyle } from 'react-native';
import { useTheme } from 'react-native-paper';
import { createStyles } from './styles';

export interface BaseCardProps {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  onPress?: () => void;
  disabled?: boolean;
  elevation?: number;
  testID?: string;
}

export const BaseCard: React.FC<BaseCardProps> = ({
  children,
  style,
  onPress,
  disabled = false,
  elevation,
  testID,
}) => {
  const theme = useTheme();
  const styles = createStyles(theme);

  return (
    <Pressable
      testID={testID}
      style={({ pressed }) => [
        styles.container,
        elevation !== undefined && { elevation },
        style,
        disabled && styles.disabled,
        pressed && styles.pressed,
      ]}
      onPress={onPress}
      disabled={disabled}
      accessible={true}
      accessibilityRole="button"
      accessibilityState={{
        disabled: disabled,
      }}
    >
      {children}
    </Pressable>
  );
};