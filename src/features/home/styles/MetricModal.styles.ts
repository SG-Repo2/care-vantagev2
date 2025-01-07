import { StyleSheet } from 'react-native';
import { MD3Theme, useTheme } from 'react-native-paper';
import { spacing } from '../../../components/common/theme/spacing';

const createStyles = (theme: MD3Theme) => StyleSheet.create({
  modalContainer: {
    margin: 0,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
  },
  modalContent: {
    padding: spacing.xl,
    paddingTop: spacing.xxl,
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    backgroundColor: theme.colors.surface,
    shadowColor: theme.colors.shadow,
    shadowOffset: {
      width: 0,
      height: -4,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 8,
  },
  closeButton: {
    position: 'absolute',
    right: spacing.md,
    top: spacing.md,
    backgroundColor: theme.colors.surfaceVariant,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: '800',
    marginBottom: spacing.sm,
    color: theme.colors.onSurface,
    letterSpacing: -0.5,
  },
  modalValue: {
    fontSize: 40,
    fontWeight: '800',
    marginBottom: spacing.xl,
    color: theme.colors.primary,
    letterSpacing: -1,
  },
  chartContainer: {
    alignItems: 'center',
    marginVertical: spacing.xl,
  },
  chart: {
    marginVertical: spacing.sm,
    borderRadius: 24,
    overflow: 'hidden',
  },
  additionalInfoContainer: {
    marginTop: spacing.xl,
    gap: spacing.lg,
    padding: spacing.md,
    backgroundColor: theme.colors.surfaceVariant,
    borderRadius: 24,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.xs,
  },
  infoLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: theme.colors.onSurfaceVariant,
  },
  infoValue: {
    fontSize: 18,
    fontWeight: '600',
    color: theme.colors.onSurface,
  },
});

export const useStyles = () => {
  const theme = useTheme();
  return createStyles(theme);
};
