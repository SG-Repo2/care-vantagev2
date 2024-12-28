import { StyleSheet } from 'react-native';
import { MD3Theme, useTheme } from 'react-native-paper';
import { ExtendedTheme } from '../types/leaderboard';

const createStyles = (theme: ExtendedTheme) => StyleSheet.create({
  container: {
    flex: 1,
  },
  headerContainer: {
    padding: 16,
    alignItems: 'center',
    elevation: 2,
  },
  title: {
    fontWeight: 'bold',
    marginBottom: 4,
  },
  scrollView: {
    flex: 1,
  },
  itemContainer: {
    padding: 16,
  },
  mainContent: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 60,
  },
  rankContainer: {
    width: 40,
    alignItems: 'center',
  },
  rank: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  userInfo: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 12,
  },
  name: {
    fontSize: 16,
    fontWeight: '500',
  },
  scoreContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 'auto',
  },
  score: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  detailsContainer: {
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.1)',
  },
  metricRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginVertical: 4,
  },
  metricLabel: {
    fontSize: 14,
  },
  metricValue: {
    fontSize: 14,
    fontWeight: '500',
  },
});

export const useStyles = () => {
  const theme = useTheme<ExtendedTheme>();
  return createStyles(theme);
};
