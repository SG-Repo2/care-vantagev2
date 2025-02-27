import { StyleSheet } from 'react-native';
import { MD3Theme } from 'react-native-paper';
import { spacing } from '../../../components/common/theme/spacing';

export const createStyles = (theme: MD3Theme) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.surfaceVariant,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: theme.colors.background,
  },
  periodSelector: {
    margin: spacing.md,
    elevation: 2,
    shadowColor: theme.colors.shadow,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    backgroundColor: theme.colors.surface,
    borderRadius: 8,
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
    marginHorizontal: spacing.md,
    marginBottom: spacing.sm,
    elevation: 2,
    shadowColor: theme.colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    backgroundColor: theme.colors.surface,
    borderRadius: 12,
  },
  currentUserEntry: {
    backgroundColor: theme.colors.primaryContainer,
    borderWidth: 2,
    borderColor: theme.colors.primary,
  },
  rankContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: theme.colors.surfaceVariant,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
    elevation: 3,
    shadowColor: theme.colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
  },
  rankText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: theme.colors.onSurfaceVariant,
  },
  topThreeRank: {
    fontSize: 20,
    color: theme.colors.primary,
    fontWeight: '900',
  },
  userContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    marginRight: spacing.md,
    borderWidth: 2,
    borderColor: theme.colors.surfaceVariant,
  },
  userInfo: {
    flex: 1,
  },
  nameText: {
    fontSize: 18,
    fontWeight: '700',
    color: theme.colors.onSurface,
    marginBottom: spacing.xs,
    letterSpacing: 0.25,
  },
  currentUserText: {
    color: theme.colors.primary,
    fontWeight: '800',
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: spacing.xs,
  },
  scoreLabel: {
    fontSize: 12,
    color: theme.colors.onSurfaceVariant,
    fontWeight: '600',
    letterSpacing: 1,
    marginBottom: 2,
  },
  scoreText: {
    fontSize: 18,
    color: theme.colors.primary,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  streakChip: {
    backgroundColor: theme.colors.tertiaryContainer,
    marginLeft: spacing.sm,
  },
  errorText: {
    color: theme.colors.error,
    textAlign: 'center',
    fontSize: 16,
    marginHorizontal: spacing.lg,
    padding: spacing.lg,
    backgroundColor: theme.colors.errorContainer,
    borderRadius: 8,
  },
  loadingText: {
    color: theme.colors.onSurface,
    marginTop: spacing.md,
    fontSize: 16,
    fontWeight: '500',
  },
  metricsText: {
    fontSize: 14,
    color: theme.colors.onSurfaceVariant,
    marginLeft: spacing.md,
    letterSpacing: 0.25,
  },
  privateAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    marginRight: spacing.md,
    backgroundColor: theme.colors.surfaceVariant,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: theme.colors.outline,
  },
  privateAvatarText: {
    fontSize: 24,
    color: theme.colors.onSurfaceVariant,
  },
});
