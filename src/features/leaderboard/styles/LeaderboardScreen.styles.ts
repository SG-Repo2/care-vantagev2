import { StyleSheet } from 'react-native';
import { MD3Theme } from 'react-native-paper';
import { spacing } from '../../../components/common/theme/spacing';

export const createStyles = (theme: MD3Theme) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
    padding: spacing.lg,
  },
  centered: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  periodSelector: {
    marginBottom: spacing.lg,
  },
  statsCard: {
    marginBottom: spacing.lg,
    padding: spacing.md,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
  },
  statItem: {
    alignItems: 'center',
  },
  statLabel: {
    fontSize: 12,
    color: theme.colors.onSurfaceVariant,
    marginBottom: spacing.xs,
  },
  statValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: theme.colors.onSurface,
  },
  achievementsContainer: {
    marginTop: spacing.md,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.onSurface,
    marginBottom: spacing.sm,
  },
  achievementChip: {
    marginRight: spacing.sm,
    backgroundColor: theme.colors.secondaryContainer,
  },
  entryContainer: {
    flexDirection: 'row',
    padding: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.outline,
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  currentUserEntry: {
    backgroundColor: theme.colors.primaryContainer,
    borderRadius: 8,
  },
  rankContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: theme.colors.surfaceVariant,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  rankText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: theme.colors.onSurfaceVariant,
  },
  topThreeRank: {
    color: theme.colors.primary,
    fontWeight: '800',
  },
  userContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: spacing.md,
  },
  userInfo: {
    flex: 1,
  },
  nameText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: theme.colors.onSurface,
    marginBottom: 4,
  },
  currentUserText: {
    color: theme.colors.primary,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  scoreText: {
    fontSize: 14,
    color: theme.colors.primary,
    fontWeight: '500',
  },
  streakChip: {
    backgroundColor: theme.colors.tertiaryContainer,
    marginLeft: spacing.sm,
  },
  errorText: {
    color: theme.colors.error,
    textAlign: 'center',
  },
  loadingText: {
    color: theme.colors.onSurface,
    marginTop: spacing.md,
  },
  metricsText: {
    fontSize: 12,
    color: theme.colors.onSurfaceVariant,
    marginLeft: spacing.sm,
  },
  privateAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: spacing.md,
    backgroundColor: theme.colors.surfaceVariant,
    justifyContent: 'center',
    alignItems: 'center',
  },
  privateAvatarText: {
    fontSize: 20,
    color: theme.colors.onSurfaceVariant,
  },
});
