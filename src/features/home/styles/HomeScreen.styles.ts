import { StyleSheet } from 'react-native';
import { MD3Theme, useTheme } from 'react-native-paper';

const createStyles = (theme: MD3Theme) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.primary,
  },
  content: {
    padding: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    marginBottom: 16,
    color: theme.colors.error,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    paddingHorizontal: 16,
    backgroundColor: theme.colors.surface,
    elevation: 2,
    shadowColor: theme.colors.primary,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: theme.colors.secondary,
  },
  title: {
    fontWeight: 'bold',
    color: theme.colors.onSurface,
  },
  leaderboardButton: {
    margin: 0,
  },
  metricsContainer: {
    width: '100%',
    alignItems: 'stretch',
    gap: 16,
    paddingHorizontal: 8,
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
