import { StyleSheet } from 'react-native';
import { MD3Theme, useTheme } from 'react-native-paper';
import { spacing } from '../../../components/common/theme/spacing';
import { layout } from '../constants/layout';

const createStyles = (theme: MD3Theme) => StyleSheet.create({
  container: {
    width: layout.CARD_WIDTH,
    height: layout.CARD_HEIGHT,
    margin: 0,
    backgroundColor: 'transparent',
  },
  content: {
    flex: 1,
    padding: 0,
    height: '100%',
    width: '100%',
  },
  iconContainer: {
    position: 'absolute',
    left: '50%',
    top: '50%',
    width: layout.CARD_WIDTH * 0.5,
    height: layout.CARD_WIDTH * 0.5,
    transform: [
      { translateX: -layout.CARD_WIDTH * 0.25 },
      { translateY: -layout.CARD_WIDTH * 0.25 }
    ],
    opacity: 0.9,
    zIndex: 2,
  },
  progressWheelContainer: {
    position: 'absolute',
    left: '50%',
    top: '50%',
    width: layout.CARD_WIDTH * 0.7,
    height: layout.CARD_WIDTH * 0.7,
    transform: [
      { translateX: -layout.CARD_WIDTH * 0.35 },
      { translateY: -layout.CARD_WIDTH * 0.35 }
    ],
    opacity: 0.8,
    zIndex: 1,
  },
  value: {
    position: 'absolute',
    right: spacing.md,
    top: spacing.md,
    fontSize: layout.CARD_WIDTH * 0.18,
    fontWeight: '800',
    textAlign: 'right',
    color: '#FFFFFF',
    maxWidth: '50%',
    zIndex: 3,
  },
  title: {
    position: 'absolute',
    bottom: spacing.md,
    left: spacing.md,
    fontSize: layout.CARD_WIDTH * 0.14,
    fontWeight: '600',
    color: '#FFFFFF',
    zIndex: 3,
  },
  errorText: {
    color: theme.colors.error,
    textAlign: 'center',
    fontSize: layout.CARD_WIDTH * 0.1,
  },
  loadingText: {
    color: theme.colors.onSurface,
    textAlign: 'center',
    fontSize: layout.CARD_WIDTH * 0.1,
  },
});

export const useStyles = () => {
  const theme = useTheme();
  return createStyles(theme);
};
