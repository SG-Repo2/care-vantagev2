import { Dimensions } from 'react-native';
import { spacing } from '../../../components/common/theme/spacing';

const SCREEN_WIDTH = Dimensions.get('window').width;
const GRID_MARGIN = spacing.md;
const CARD_GAP = spacing.xs;
const GRID_WIDTH = SCREEN_WIDTH - (GRID_MARGIN * 2);
const CARD_WIDTH = (GRID_WIDTH - CARD_GAP) / 2;
const CARD_HEIGHT = CARD_WIDTH * 1.2;

export const layout = {
  SCREEN_WIDTH,
  GRID_MARGIN,
  CARD_GAP,
  GRID_WIDTH,
  CARD_WIDTH,
  CARD_HEIGHT,
}; 