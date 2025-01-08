import { StyleSheet, Platform } from 'react-native';
import { MD3Theme } from 'react-native-paper';
import { spacing } from '../../../components/common/theme/spacing';

export const createStyles = (theme: MD3Theme) => StyleSheet.create({
  container: {
    flex: 1,
    padding: spacing.xl,
    backgroundColor: theme.colors.background,
    justifyContent: 'center',
  },
  contentContainer: {
    backgroundColor: theme.colors.surface,
    borderRadius: 24,
    padding: spacing.xl,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  title: {
    fontSize: 32,
    fontWeight: '700',
    marginBottom: spacing.sm,
    color: theme.colors.onBackground,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: theme.colors.onSurfaceVariant,
    marginBottom: spacing.xl,
    textAlign: 'center',
  },
  input: {
    marginBottom: spacing.md,
    backgroundColor: 'transparent',
  },
  errorText: {
    fontSize: 14,
    color: theme.colors.error,
    marginBottom: spacing.md,
    textAlign: 'center',
  },
  dividerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: spacing.lg,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: theme.colors.outlineVariant,
  },
  dividerText: {
    marginHorizontal: spacing.md,
    color: theme.colors.onSurfaceVariant,
    fontSize: 14,
  },
  button: {
    marginBottom: spacing.md,
    borderRadius: 12,
  },
  primaryButton: {
    backgroundColor: theme.colors.primary,
  },
  googleButton: {
    backgroundColor: '#4285F4', // Google's official blue
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  googleIcon: {
    width: 18,
    height: 18,
    marginRight: spacing.sm,
  },
  registerButton: {
    marginTop: spacing.sm,
  },
  registerButtonText: {
    color: theme.colors.primary,
  },
});