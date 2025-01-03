import { StyleSheet } from 'react-native';
import { MD3Theme, useTheme } from 'react-native-paper';
import { spacing } from '../../../components/common/theme/spacing';

const createStyles = (theme: MD3Theme) => StyleSheet.create({
  container: {
    flex: 1,
    margin: spacing.sm,
    minHeight: 120,
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  value: {
    marginTop: spacing.sm,
    fontSize: 24,
    fontWeight: '600',
  },
  title: {
    marginTop: spacing.xs,
    fontSize: 14,
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
