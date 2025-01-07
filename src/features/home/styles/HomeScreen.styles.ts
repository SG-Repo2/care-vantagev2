import { StyleSheet } from 'react-native';
import { MD3Theme, useTheme } from 'react-native-paper';
import { spacing } from '../../../components/common/theme/spacing';
import { layout } from '../../../components/common/theme/layout';

const createStyles = (theme: MD3Theme) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  content: {
    padding: spacing.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    marginBottom: spacing.lg,
    color: theme.colors.error,
    fontSize: 16,
  },
  header: {
    marginBottom: spacing.lg,
    paddingHorizontal: spacing.lg,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: theme.colors.onBackground,
  },
  leaderboardButton: {
    margin: 0,
  },
  scoreContainer: {
    alignItems: 'center',
    backgroundColor: theme.colors.primaryContainer,
    borderRadius: layout.borderRadius.large,
    padding: spacing.md,
    marginVertical: spacing.md,
  },
  scoreLabel: {
    color: theme.colors.onPrimaryContainer,
    marginBottom: spacing.xs,
  },
  scoreValue: {
    color: theme.colors.primary,
    fontWeight: 'bold',
  },
  metricsGrid: {
    width: '100%',
    flexDirection: 'column',
    gap: spacing.lg,
    paddingHorizontal: spacing.md,
  },
  scrollView: {
    flex: 1,
  },
  centered: {
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export const useStyles = () => {
  const theme = useTheme();
  return createStyles(theme);
};
