import { StyleSheet } from 'react-native';
import { spacing } from '../../theme/spacing';

export const createStyles = (theme: any) => StyleSheet.create({
  container: {
    backgroundColor: theme.colors.surface,
    borderRadius: 24,
    padding: spacing.lg,
    borderWidth: 0,
    shadowColor: theme.colors.shadow,
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
    overflow: 'hidden',
    transform: [{ scale: 1 }],
  },
  pressed: {
    transform: [{ scale: 0.98 }],
    shadowOpacity: 0.15,
    shadowRadius: 6,
  },
  disabled: {
    opacity: 0.6,
    shadowOpacity: 0.1,
  },
  gradientContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: 24,
  },
});