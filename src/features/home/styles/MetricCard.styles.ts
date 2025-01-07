import { StyleSheet } from 'react-native';
import { MD3Theme, useTheme } from 'react-native-paper';
import { spacing } from '../../../components/common/theme/spacing';
import { layout } from '../../../components/common/theme/layout';

const createStyles = (theme: MD3Theme) => StyleSheet.create({
  container: {
    minHeight: 120,
    backgroundColor: 'transparent',
    borderWidth: 2,
    marginVertical: spacing.xs,
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.md,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: layout.borderRadius.large,
  },
  value: {
    marginTop: spacing.sm,
    fontSize: 28,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  title: {
    marginTop: spacing.xs,
    fontSize: 16,
    textAlign: 'center',
  },
  errorText: {
    color: theme.colors.error,
    textAlign: 'center',
    padding: spacing.sm,
  },
  loadingText: {
    color: theme.colors.onSurface,
    textAlign: 'center',
    padding: spacing.sm,
  },
});

export const useStyles = () => {
  const theme = useTheme();
  return createStyles(theme);
};
