import { StyleSheet, Dimensions } from 'react-native';
import { MD3Theme, useTheme } from 'react-native-paper';
import { spacing } from '../../../components/common/theme/spacing';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// Constants for grid layout
const GRID_MARGIN = spacing.md; // Margin around the entire grid
const CARD_GAP = spacing.sm; // Gap between cards
const GRID_WIDTH = SCREEN_WIDTH - (GRID_MARGIN * 2); // Available width for grid
const CARD_SIZE = (GRID_WIDTH - CARD_GAP) / 2; // Each card takes up half the space

const createStyles = (theme: MD3Theme) => StyleSheet.create({
  container: {
    width: CARD_SIZE,
    height: CARD_SIZE, // Make it square
    margin: 0, // Remove margin as we'll handle spacing in the grid
    borderRadius: 16,
    overflow: 'hidden',
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.sm,
    height: '100%',
  },
  iconContainer: {
    position: 'absolute',
    left: '10%',
    top: '20%',
    width: CARD_SIZE * 0.4,
    height: CARD_SIZE * 0.4,
    opacity: 0.9,
  },
  value: {
    position: 'absolute',
    right: spacing.sm,
    top: '25%',
    fontSize: CARD_SIZE * 0.25,
    fontWeight: '800',
    textAlign: 'right',
    color: theme.colors.onPrimary,
    textShadowColor: 'rgba(0, 0, 0, 0.2)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 3,
    maxWidth: '60%',
  },
  title: {
    position: 'absolute',
    bottom: spacing.sm,
    left: spacing.sm,
    right: spacing.sm,
    fontSize: CARD_SIZE * 0.15,
    fontWeight: '600',
    textAlign: 'left',
    color: theme.colors.onPrimary,
    opacity: 0.9,
    lineHeight: CARD_SIZE * 0.18,
  },
  chartContainer: {
    position: 'absolute',
    bottom: '20%',
    left: 0,
    right: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  errorText: {
    color: theme.colors.onError,
    textAlign: 'center',
    padding: spacing.sm,
    fontSize: CARD_SIZE * 0.12,
    fontWeight: '500',
  },
  loadingText: {
    color: theme.colors.onPrimary,
    textAlign: 'center',
    padding: spacing.sm,
    fontSize: CARD_SIZE * 0.12,
    fontWeight: '500',
  },
});

export const useStyles = () => {
  const theme = useTheme();
  return createStyles(theme);
};
