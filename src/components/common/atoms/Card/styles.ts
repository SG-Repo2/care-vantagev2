import { StyleSheet } from 'react-native';
import { spacing } from '../../theme/spacing';

export const createStyles = (theme: any) => StyleSheet.create({
  container: {
    width: '100%',
    height: '100%',
    backgroundColor: 'transparent',
    borderRadius: 24,
    padding: 0,
    margin: 0,
    borderWidth: 0,
    shadowColor: theme.colors.shadow,
    shadowOffset: {
      width: 0,
      height: 8,
    },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
    overflow: 'hidden',
  },
  pressed: {
    transform: [{ scale: 0.98 }],
    shadowOpacity: 0.15,
    shadowRadius: 6,
  },
  disabled: {
    opacity: 0.6,
    shadowOpacity: 0.1,
  },
  gradientContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
});
