import React, { useState } from 'react';
import { View } from 'react-native';
import { Text, useTheme } from 'react-native-paper';
import { StackNavigationProp } from '@react-navigation/stack';
import { AuthStackParamList } from '../../../navigation/types';
import { useAuth } from '../../../context/AuthContext';
import { Button } from '../../../components/common/atoms/Button';
import { createStyles } from '../styles/RegisterScreen.styles';

type RegisterScreenProps = {
  navigation: StackNavigationProp<AuthStackParamList, 'Register'>;
};

export const RegisterScreen: React.FC<RegisterScreenProps> = ({ navigation }) => {
  const [localError, setLocalError] = useState<string | null>(null);
  const { signInWithGoogle, error: authError, isLoading } = useAuth();
  const theme = useTheme();

  const handleGoogleSignIn = async () => {
    setLocalError(null);
    try {
      await signInWithGoogle();
    } catch (err) {
      console.error('Google sign-in error:', err);
      setLocalError('Failed to sign in with Google. Please try again.');
    }
  };

  const error = localError || authError;

  const styles = createStyles(theme);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Create Account</Text>
      
      <Text style={styles.subtitle}>
        Create an account quickly and easily using your Google account
      </Text>

      {error && (
        <Text style={styles.errorText}>{error}</Text>
      )}

      <Button
        variant="primary"
        size="large"
        onPress={handleGoogleSignIn}
        loading={isLoading}
        disabled={isLoading}
        icon="google"
        fullWidth
        style={styles.button}
      >
        Sign up with Google
      </Button>

      <Button
        variant="text"
        size="medium"
        onPress={() => navigation.navigate('Login')}
        disabled={isLoading}
        fullWidth
        style={styles.button}
      >
        Already have an account? Sign in
      </Button>
    </View>
  );
};
