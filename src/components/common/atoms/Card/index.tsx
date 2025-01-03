import React from 'react';
import { View, StyleSheet, StyleProp, ViewStyle } from 'react-native';
import { useTheme } from 'react-native-paper';
import { spacing } from '../../theme/spacing';

interface CardProps {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  onPress?: () => void;
  disabled?: boolean;
}

export const Card: React.FC<CardProps> = ({ children, style, onPress, disabled = false }) => {
  const theme = useTheme();
  const styles = createStyles(theme);

  return (
    <View
      style={[
        styles.container,
        style,
        disabled && styles.disabled,
      ]}
    >
      {children}
    </View>
  );
};

const createStyles = (theme: any) => StyleSheet.create({
  container: {
    backgroundColor: theme.colors.surface,
    borderRadius: 16,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: theme.colors.outline,
    shadowColor: theme.colors.shadow,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 2,
  },
  disabled: {
    opacity: 0.5,
  },
});