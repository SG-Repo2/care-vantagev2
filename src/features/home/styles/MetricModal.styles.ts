import { StyleSheet } from 'react-native';
import { MD3Theme, useTheme } from 'react-native-paper';
import { spacing } from '../../../components/common/theme/spacing';

const createStyles = (theme: MD3Theme) => StyleSheet.create({
  modalContainer: {
    margin: 0,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    padding: spacing.xl,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
  },
  closeButton: {
    position: 'absolute',
    right: spacing.sm,
    top: spacing.sm,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginTop: spacing.sm,
    marginBottom: spacing.xs,
    color: theme.colors.onSurface,
  },
  modalValue: {
    fontSize: 32,
    fontWeight: 'bold',
    marginBottom: spacing.lg,
  },
  chartContainer: {
    alignItems: 'center',
    marginVertical: spacing.lg,
  },
  chart: {
    marginVertical: spacing.sm,
    borderRadius: 16,
  },
  additionalInfoContainer: {
    marginTop: spacing.lg,
    gap: spacing.md,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  infoLabel: {
    fontSize: 16,
    color: theme.colors.onSurfaceVariant,
  },
  infoValue: {
    fontSize: 18,
    color: theme.colors.onSurface,
  },
});

export const useStyles = () => {
  const theme = useTheme();
  return createStyles(theme);
};
