import React from 'react';
import { TouchableOpacity, Text, ActivityIndicator, StyleSheet, View, StyleProp, ViewStyle } from 'react-native';
import { useTheme } from 'react-native-paper';
import { spacing } from '../../theme/spacing';
import { ButtonProps } from './types';

export const Button: React.FC<ButtonProps> = ({
  variant = 'primary',
  size = 'medium',
  onPress,
  disabled = false,
  children,
  fullWidth = false,
  loading = false,
  icon,
  iconPosition = 'left',
  style,
}) => {
  const theme = useTheme();
  const styles = createStyles(theme);

  const variantStyles = {
    primary: styles.primary,
    secondary: styles.secondary,
    outline: styles.outline,
    text: styles.textVariant,
  };

  const sizeStyles = {
    small: styles.small,
    medium: styles.medium,
    large: styles.large,
  };

  return (
    <TouchableOpacity
      style={[
        styles.base,
        variantStyles[variant],
        sizeStyles[size],
        fullWidth && styles.fullWidth,
        disabled && styles.disabled,
        loading && styles.loading,
        style,
      ]}
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.8}
    >
      {loading ? (
        <ActivityIndicator color={theme.colors.onPrimary} />
      ) : (
        <View style={styles.iconContainer}>
          {icon && iconPosition === 'left' && (
            <View style={styles.iconLeft}>
              {typeof icon === 'string' ? <Text>{icon}</Text> : icon}
            </View>
          )}
          <Text style={[
            styles.textBase,
            variant === 'text' && styles.textVariantText,
          ]}>
            {children}
          </Text>
          {icon && iconPosition === 'right' && (
            <View style={styles.iconRight}>
              {typeof icon === 'string' ? <Text>{icon}</Text> : icon}
            </View>
          )}
        </View>
      )}
    </TouchableOpacity>
  );
};

const createStyles = (theme: any) => StyleSheet.create({
  base: {
    borderRadius: 8,
    padding: spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: spacing.sm,
  },
  primary: {
    backgroundColor: theme.colors.primary,
    borderWidth: 0,
  },
  secondary: {
    backgroundColor: theme.colors.secondary,
    borderWidth: 0,
  },
  outline: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: theme.colors.primary,
  },
  textVariant: {
    backgroundColor: 'transparent',
    borderWidth: 0,
  },
  small: {
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.sm,
  },
  medium: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
  },
  large: {
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
  },
  fullWidth: {
    width: '100%',
  },
  disabled: {
    opacity: 0.5,
  },
  loading: {
    opacity: 0.7,
  },
  iconContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconLeft: {
    marginRight: spacing.xs,
  },
  iconRight: {
    marginLeft: spacing.xs,
  },
  textBase: {
    color: theme.colors.onPrimary,
    fontSize: 16,
    fontWeight: '600',
  },
  textVariantText: {
    color: theme.colors.primary,
  },
});