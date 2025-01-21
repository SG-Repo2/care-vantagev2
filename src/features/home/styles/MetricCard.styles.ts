import { StyleSheet } from 'react-native';
import { MD3Theme, useTheme } from 'react-native-paper';
import { spacing } from '../../../theme';
import { layout } from '../constants/layout';

const createStyles = (theme: MD3Theme) => StyleSheet.create({
  container: {
    width: layout.CARD_WIDTH,
    height: layout.CARD_HEIGHT,
    margin: 0,
    backgroundColor: 'transparent',
  },
  content: {
    flex: 0,
    padding: 0,
    height: '100%',
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconContainer: {
    position: 'absolute',
    width: layout.CARD_WIDTH * 0.35,
    height: layout.CARD_WIDTH * 0.35,
    alignItems: 'center',
    justifyContent: 'center',
    opacity: 0.9,
    zIndex: 2,
  },
  progressWheelContainer: {
    position: 'absolute',
    width: layout.CARD_WIDTH * 0.6,
    height: layout.CARD_WIDTH * 0.6,
    alignItems: 'center',
    justifyContent: 'center',
    opacity: 0.8,
    zIndex: 1,
  },
  value: {
    position: 'absolute',
    width: '100%',
    top: spacing.sm,
    fontSize: layout.CARD_WIDTH * 0.15,
    fontWeight: '800',
    textAlign: 'center',
    color: '#FFFFFF',
    zIndex: 3,
  },
  title: {
    position: 'absolute',
    bottom: spacing.sm,
    width: '100%',
    textAlign: 'center',
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
