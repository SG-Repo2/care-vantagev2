import { MD3DarkTheme, MD3LightTheme } from 'react-native-paper';
import { MD3Colors } from 'react-native-paper/lib/typescript/types';

export const lightColors: MD3Colors = {
  ...MD3LightTheme.colors,
  primary: '#006A6A',
  onPrimary: '#FFFFFF',
  primaryContainer: '#6FF7F7',
  onPrimaryContainer: '#002020',
  secondary: '#4A6363',
  onSecondary: '#FFFFFF',
  secondaryContainer: '#CCE8E7',
  onSecondaryContainer: '#051F1F',
  background: '#FAFDFC',
  surface: '#FAFDFC',
  error: '#BA1A1A',
};

export const darkColors: MD3Colors = {
  ...MD3DarkTheme.colors,
  primary: '#4CDADA',
  onPrimary: '#003737',
  primaryContainer: '#004F4F',
  onPrimaryContainer: '#6FF7F7',
  secondary: '#B0CCCC',
  onSecondary: '#1B3434',
  secondaryContainer: '#324B4B',
  onSecondaryContainer: '#CCE8E7',
  background: '#191C1C',
  surface: '#191C1C',
  error: '#FFB4AB',
};

export const lightTheme = {
  ...MD3LightTheme,
  colors: lightColors,
};

export const darkTheme = {
  ...MD3DarkTheme,
  colors: darkColors,
};

export type AppTheme = typeof lightTheme;
