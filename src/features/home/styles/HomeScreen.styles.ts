import { StyleSheet, Dimensions } from 'react-native';
import { MD3Theme, useTheme } from 'react-native-paper';
import { spacing } from '../../../components/common/theme/spacing';

const SCREEN_WIDTH = Dimensions.get('window').width;

// Grid layout constants (matching MetricCard)
const GRID_MARGIN = spacing.md;
const CARD_GAP = spacing.sm;
const GRID_WIDTH = SCREEN_WIDTH - (GRID_MARGIN * 2);

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
    paddingHorizontal: GRID_MARGIN,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
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
    borderRadius: 16,
    overflow: 'hidden',
    marginVertical: spacing.sm,
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
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginHorizontal: GRID_MARGIN,
    gap: CARD_GAP,
    width: GRID_WIDTH,
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
  },
});

export const useStyles = () => {
  const theme = useTheme();
  return createStyles(theme);
};