import { StyleSheet } from 'react-native';
import { MD3Theme } from 'react-native-paper';
import { spacing } from '../../../components/common/theme/spacing';

export const createStyles = (theme: MD3Theme) => StyleSheet.create({
  container: {
    flex: 1,
    padding: spacing.xl,
    backgroundColor: theme.colors.background,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: spacing.xl,
    color: theme.colors.onBackground,
    textAlign: 'center',
  },
  input: {
    marginBottom: spacing.md,
  },
  errorText: {
    fontSize: 14,
    color: theme.colors.error,
    marginBottom: spacing.md,
    textAlign: 'center',
  },
  button: {
    marginBottom: spacing.sm,
  },
});