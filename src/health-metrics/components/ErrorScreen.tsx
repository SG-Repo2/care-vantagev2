import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Text, useTheme } from 'react-native-paper';
import { Button } from '../../components/common/atoms/Button';

interface ErrorScreenProps {
  error: string;
  onRetry?: () => void;
}

export const ErrorScreen: React.FC<ErrorScreenProps> = ({ 
  error,
  onRetry 
}) => {
  const theme = useTheme();
  
  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <Text style={styles.errorText}>
        {error}
      </Text>
      {onRetry && (
        <Button
          variant="primary"
          size="medium"
          onPress={onRetry}
          style={styles.button}
        >
          Try Again
        </Button>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#000',
    padding: 20,
  },
  errorText: {
    color: '#FF4B4B',
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 20,
  },
  button: {
    minWidth: 120,
    backgroundColor: '#23C552',
  },
}); 