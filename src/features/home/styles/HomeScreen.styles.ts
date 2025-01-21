import { StyleSheet } from 'react-native';
import { MD3Theme, useTheme } from 'react-native-paper';
import { spacing } from '../../../theme';
import { layout } from '../constants/layout';

const createStyles = (theme: MD3Theme) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  surface: {
    backgroundColor: theme.colors.surface,
  },
  content: {
    flexGrow: 1,
    paddingTop: spacing.md,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.md,
  },
  errorText: {
    marginBottom: spacing.sm,
    color: theme.colors.onError,
    fontSize: 16,
    fontWeight: '500',
    textAlign: 'center',
  },
  header: {
    marginBottom: spacing.md,
    paddingHorizontal: layout.GRID_MARGIN,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  welcomeText: {
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
    borderRadius: 16,
    overflow: 'hidden',
    marginVertical: spacing.sm,
    height: 150,
    marginTop: 1,
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
    padding: spacing.md,
    alignItems: 'center',
    justifyContent: 'space-between',
    height: '100%',
  },
  dashboardTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: theme.colors.onPrimaryContainer,
    marginBottom: spacing.sm,
  },
  metricsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    paddingHorizontal: spacing.sm,
  },
  metricColumn: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: spacing.xs,
  },
  metricLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: theme.colors.onPrimaryContainer,
    opacity: 0.8,
    marginBottom: spacing.xs,
  },
  metricValue: {
    fontSize: 20,
    fontWeight: '700',
    color: theme.colors.onPrimaryContainer,
  },
  scoreContent: {
    alignItems: 'flex-start',
  },
  rankContent: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.surfaceVariant,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderRadius: 12,
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
  rankLabel: {
    color: theme.colors.onSurfaceVariant,
    fontSize: 14,
    fontWeight: '500',
    marginBottom: spacing.xs,
    opacity: 0.9,
  },
  rankValue: {
    color: theme.colors.primary,
    fontSize: 28,
    fontWeight: '700',
    letterSpacing: -0.5,
  },
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginHorizontal: layout.GRID_MARGIN,
    rowGap: layout.CARD_GAP,
    columnGap: layout.CARD_GAP,
    width: layout.GRID_WIDTH,
    paddingBottom: spacing.md,
    backgroundColor: 'transparent',
  },
  scrollView: {
    flex: 1,
  },
  centered: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: spacing.sm,
    color: theme.colors.onSurface,
    fontSize: 16,
    fontWeight: '500',
  },
  retryButton: {
    marginTop: spacing.sm,
    backgroundColor: theme.colors.errorContainer,
  },
  loadingGradient: {
    padding: spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 16,
    backgroundColor: theme.colors.surfaceVariant,
  },
  errorGradient: {
    padding: spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 16,
    backgroundColor: theme.colors.errorContainer,
    width: '90%',
  },
  errorActions: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: spacing.sm,
    gap: spacing.sm,
  },
  closeButton: {
    backgroundColor: theme.colors.surfaceVariant,
  },
});

export const useStyles = () => {
  const theme = useTheme();
  return createStyles(theme);
};