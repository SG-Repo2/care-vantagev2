import { StyleSheet } from 'react-native';
import { spacing, AppTheme } from '../../../../theme';
import { ButtonProps } from './types';

export const createStyles = (theme: AppTheme, props: ButtonProps) => StyleSheet.create({
  base: {
    borderRadius: theme.layout.borderRadius.medium,
    padding: spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: spacing.sm
  },
  primary: {
    backgroundColor: theme.colors.primary,
    borderWidth: 0
  },
  secondary: {
    backgroundColor: theme.colors.secondary,
    borderWidth: 0
  },
  outline: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: theme.colors.primary
  },
  small: {
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.sm
  },
  medium: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md
  },
  large: {
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg
  },
  fullWidth: {
    width: '100%'
  },
  disabled: {
    opacity: 0.5
  },
  loading: {
    opacity: 0.7
  },
  iconContainer: {
    flexDirection: 'row',
    alignItems: 'center'
  },
  iconLeft: {
    marginRight: spacing.xs
  },
  iconRight: {
    marginLeft: spacing.xs
  }
});
