import { StyleSheet } from 'react-native';
import { MD3Theme } from 'react-native-paper';
import { spacing } from '../../../components/common/theme/spacing';

export const createStyles = (theme: MD3Theme) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  contentContainer: {
    flex: 1,
    padding: spacing.xl,
    justifyContent: 'center',
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    marginBottom: spacing.md,
    color: theme.colors.onBackground,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    marginBottom: spacing.xl,
    color: theme.colors.onBackground,
    textAlign: 'center',
    opacity: 0.7,
  },
  input: {
    marginBottom: spacing.md,
    backgroundColor: theme.colors.surface,
  },
  errorText: {
    fontSize: 14,
    color: theme.colors.error,
    marginBottom: spacing.md,
    textAlign: 'center',
  },
  button: {
    marginBottom: spacing.md,
  },
  primaryButton: {
    backgroundColor: theme.colors.primary,
  },
  googleButton: {
    backgroundColor: '#4285F4',
  },
  dividerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: spacing.md,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: theme.colors.outline,
  },
  dividerText: {
    marginHorizontal: spacing.md,
    color: theme.colors.onBackground,
    opacity: 0.7,
  },
});
