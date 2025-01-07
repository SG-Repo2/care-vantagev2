import React from 'react';
import { StyleProp, ViewStyle } from 'react-native';
import { BaseCard } from './BaseCard';
import { GradientCard } from './GradientCard';

interface CardProps {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  onPress?: () => void;
  disabled?: boolean;
  gradientColors?: string[];
  gradientStart?: { x: number; y: number };
  gradientEnd?: { x: number; y: number };
  elevation?: number;
  testID?: string;
}

export const Card: React.FC<CardProps> = ({
  gradientColors,
  ...props
}) => {
  if (gradientColors) {
    return <GradientCard gradientColors={gradientColors} {...props} />;
  }

  return <BaseCard {...props} />;
};

// Export all card variants for direct usage when needed
export { BaseCard, type BaseCardProps } from './BaseCard';
export { GradientCard, type GradientCardProps } from './GradientCard';
