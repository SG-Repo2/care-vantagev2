import React from 'react';
import LinearGradient from 'react-native-linear-gradient';
import { useTheme } from 'react-native-paper';
import { BaseCard, BaseCardProps } from './BaseCard';
import { createStyles } from './styles';

export interface GradientCardProps extends BaseCardProps {
  gradientColors: string[];
  gradientStart?: { x: number; y: number };
  gradientEnd?: { x: number; y: number };
}

export const GradientCard: React.FC<GradientCardProps> = ({
  children,
  gradientColors,
  gradientStart = { x: 0, y: 0 },
  gradientEnd = { x: 1, y: 1 },
  ...baseProps
}) => {
  const theme = useTheme();
  const styles = createStyles(theme);

  return (
    <BaseCard {...baseProps}>
      <LinearGradient
        colors={gradientColors}
        start={gradientStart}
        end={gradientEnd}
        style={styles.gradientContainer}
      />
      {children}
    </BaseCard>
  );
};