import { StyleSheet, Dimensions } from 'react-native';
import { MD3Theme, useTheme } from 'react-native-paper';
import { spacing } from '../../../components/common/theme/spacing';
import { layout } from '../../../components/common/theme/layout';

const SCREEN_WIDTH = Dimensions.get('window').width;
const GRID_PADDING = spacing.xl;
const CARD_GAP = spacing.md;
// Calculate card size accounting for grid padding and gap between cards
const CARD_SIZE = (SCREEN_WIDTH - (GRID_PADDING * 2) - CARD_GAP) / 2;

const createStyles = (theme: MD3Theme) => StyleSheet.create({
  container: {
    width: CARD_SIZE,
    height: CARD_SIZE,
    margin: CARD_GAP / 2, // Use half gap for even spacing between cards
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.md,
    height: '100%',
  },
  iconContainer: {
    position: 'absolute',
    left: '10%',
    top: '50%',
    width: CARD_SIZE * 0.4,
    height: CARD_SIZE * 0.4,
    transform: [{ translateY: -CARD_SIZE * 0.2 }],
    opacity: 0.9,
  },
  value: {
    position: 'absolute',
    right: spacing.md,
    top: '50%',
    transform: [{ translateY: -CARD_SIZE * 0.15 }],
    fontSize: CARD_SIZE * 0.18,
    fontWeight: '800',
    textAlign: 'right',
    color: theme.colors.onPrimary,
    textShadowColor: 'rgba(0, 0, 0, 0.1)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  title: {
    position: 'absolute',
    bottom: spacing.md,
    left: spacing.md,
    right: spacing.md,
    fontSize: CARD_SIZE * 0.12,
    fontWeight: '600',
    textAlign: 'left',
    color: theme.colors.onPrimary,
    opacity: 0.9,
  },
  errorText: {
    color: theme.colors.onError,
    textAlign: 'center',
    padding: spacing.md,
    fontSize: CARD_SIZE * 0.12,
    fontWeight: '500',
  },
  loadingText: {
    color: theme.colors.onPrimary,
    textAlign: 'center',
    padding: spacing.md,
    fontSize: CARD_SIZE * 0.12,
    fontWeight: '500',
  }
});

export const useStyles = () => {
  const theme = useTheme();
  return createStyles(theme);
};
