import { StyleSheet } from 'react-native';
import { ExtendedTheme } from '../../../theme';

export const createStyles = (theme: ExtendedTheme) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.colors.background,
    },
    listContainer: {
      paddingHorizontal: 16,
      paddingTop: 16,
    },
    entryContainer: {
      backgroundColor: theme.colors.card,
      borderRadius: 12,
      marginBottom: 12,
      padding: 16,
      shadowColor: theme.colors.shadow,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 3,
    },
    userEntryContainer: {
      backgroundColor: theme.colors.secondary + '15', // 15% opacity
      borderWidth: 1,
      borderColor: theme.colors.secondary,
    },
    headerRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    rankContainer: {
      width: 32,
      height: 32,
      borderRadius: 16,
      backgroundColor: theme.colors.secondary + '20',
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: 12,
    },
    rankText: {
      ...theme.textVariants.body,
      color: theme.colors.secondary,
      fontWeight: 'bold',
    },
    userInfo: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
    },
    avatar: {
      width: 40,
      height: 40,
      borderRadius: 20,
      marginRight: 12,
    },
    nameText: {
      ...theme.textVariants.body,
      color: theme.colors.text,
      fontWeight: '600',
    },
    scoreContainer: {
      backgroundColor: theme.colors.secondary + '10',
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 16,
    },
    scoreText: {
      ...theme.textVariants.body,
      color: theme.colors.secondary,
      fontWeight: 'bold',
    },
    detailsContainer: {
      marginTop: 12,
      paddingTop: 12,
      borderTopWidth: 1,
      borderTopColor: theme.colors.border,
    },
    metricRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 8,
    },
    metricLabel: {
      ...theme.textVariants.caption,
      color: theme.colors.textSecondary,
    },
    metricValue: {
      ...theme.textVariants.body,
      color: theme.colors.text,
      fontWeight: '500',
    },
    expandButton: {
      padding: 8,
      marginLeft: 8,
    },
    loadingContainer: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
    },
    errorText: {
      ...theme.textVariants.body,
      color: theme.colors.error,
      textAlign: 'center',
      margin: 16,
    },
  });
