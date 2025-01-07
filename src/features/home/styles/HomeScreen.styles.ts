import { StyleSheet } from 'react-native';
import { MD3Theme, useTheme } from 'react-native-paper';
import { spacing } from '../../../components/common/theme/spacing';
import { layout } from '../../../components/common/theme/layout';

const createStyles = (theme: MD3Theme) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  surface: {
    backgroundColor: theme.colors.surface,
  },
  content: {
    padding: spacing.xl,
    paddingTop: spacing.md,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
  },
  errorText: {
    marginBottom: spacing.lg,
    color: theme.colors.onError,
    fontSize: 16,
    fontWeight: '500',
    textAlign: 'center',
  },
  header: {
    marginBottom: spacing.xl,
    paddingHorizontal: spacing.lg,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: theme.colors.onBackground,
    letterSpacing: -0.5,
  },
  leaderboardButton: {
    margin: 0,
    backgroundColor: theme.colors.surfaceVariant,
  },
  scoreContainer: {
    borderRadius: 32,
    overflow: 'hidden',
    marginVertical: spacing.md,
    shadowColor: theme.colors.shadow,
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  scoreGradient: {
    padding: spacing.xl,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scoreLabel: {
    color: theme.colors.onPrimaryContainer,
    fontSize: 18,
    fontWeight: '600',
    marginBottom: spacing.xs,
  },
  scoreValue: {
    color: theme.colors.primary,
    fontSize: 48,
    fontWeight: '800',
    letterSpacing: -1,
  },
  metricsGrid: {
    width: '100%',
    flexDirection: 'column',
    gap: spacing.md,
  },
  scrollView: {
    flex: 1,
  },
  centered: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: spacing.md,
    color: theme.colors.onSurface,
    fontSize: 16,
    fontWeight: '500',
  },
  retryButton: {
    marginTop: spacing.md,
    backgroundColor: theme.colors.errorContainer,
  },
  loadingGradient: {
    padding: spacing.xl,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 32,
    backgroundColor: theme.colors.surfaceVariant,
  },
  errorGradient: {
    padding: spacing.xl,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 32,
    backgroundColor: theme.colors.errorContainer,
  },
});

export const useStyles = () => {
  const theme = useTheme();
  return createStyles(theme);
};