import { StyleSheet } from 'react-native';
import { MD3Theme, useTheme } from 'react-native-paper';
import { spacing } from '../../../components/common/theme/spacing';
import { layout } from '../../../components/common/theme/layout';

const createStyles = (theme: MD3Theme) => StyleSheet.create({
  container: {
    minHeight: 140,
    marginVertical: spacing.sm,
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.lg,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: theme.colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  value: {
    marginTop: spacing.xs,
    fontSize: 32,
    fontWeight: '800',
    textAlign: 'center',
    color: theme.colors.onPrimary,
    textShadowColor: 'rgba(0, 0, 0, 0.15)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  title: {
    marginTop: spacing.xs,
    fontSize: 18,
    fontWeight: '600',
    textAlign: 'center',
    color: theme.colors.onPrimary,
    opacity: 0.9,
  },
  errorText: {
    color: theme.colors.onError,
    textAlign: 'center',
    padding: spacing.lg,
    fontSize: 16,
    fontWeight: '500',
  },
  loadingText: {
    color: theme.colors.onPrimary,
    textAlign: 'center',
    padding: spacing.lg,
    fontSize: 16,
    fontWeight: '500',
  },
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.1)',
  },
});

export const useStyles = () => {
  const theme = useTheme();
  return createStyles(theme);
};
