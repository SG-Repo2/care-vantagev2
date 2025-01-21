import { StyleSheet } from 'react-native';
import type { MD3Theme } from 'react-native-paper';

export const createStyles = (theme: MD3Theme) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.colors.background,
    },
    centered: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: theme.colors.background,
    },
    periodSelector: {
      margin: 16,
      elevation: 2,
      shadowColor: theme.colors.shadow,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.25,
      shadowRadius: 3.84,
      borderRadius: 8,
    },
    entryContainer: {
      marginHorizontal: 16,
      marginVertical: 8,
      elevation: 2,
      borderRadius: 12,
    },
    currentUserEntry: {
      backgroundColor: theme.colors.primaryContainer,
      borderWidth: 2,
      borderColor: theme.colors.primary,
    },
    cardContent: {
      flexDirection: 'row',
      alignItems: 'center',
      padding: 12,
    },
    rankContainer: {
      width: 40,
      alignItems: 'center',
      marginRight: 12,
    },
    rankText: {
      fontSize: 16,
      fontWeight: 'bold',
      color: theme.colors.onSurface,
    },
    topThreeRank: {
      color: theme.colors.primary,
      fontSize: 18,
    },
    privateAvatar: {
      width: 48,
      height: 48,
      borderRadius: 24,
      backgroundColor: theme.colors.surfaceVariant,
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: 12,
    },
    privateAvatarText: {
      fontSize: 24,
      color: theme.colors.onSurfaceVariant,
    },
    userInfoContainer: {
      flex: 1,
      marginLeft: 12,
    },
    displayName: {
      fontSize: 16,
      fontWeight: 'bold',
      color: theme.colors.onSurface,
    },
    scoreText: {
      fontSize: 14,
      color: theme.colors.onSurfaceVariant,
      marginTop: 4,
    },
    streakText: {
      fontSize: 12,
      color: theme.colors.secondary,
      marginTop: 4,
    },
    loadingText: {
      marginTop: 8,
      color: theme.colors.onSurface,
    },
    errorText: {
      color: theme.colors.error,
      textAlign: 'center',
      margin: 16,
    },
    listContent: {
      paddingVertical: 8,
    },
  });
