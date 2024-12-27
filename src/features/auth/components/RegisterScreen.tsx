import React, { useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { useTheme, Button, Text } from 'react-native-paper';
import { StackNavigationProp } from '@react-navigation/stack';
import { AuthStackParamList } from '../../../navigation/types';
import { useAuth } from '../../../context/AuthContext';

type RegisterScreenProps = {
  navigation: StackNavigationProp<AuthStackParamList, 'Register'>;
};

export const RegisterScreen: React.FC<RegisterScreenProps> = ({ navigation }) => {
  const [localError, setLocalError] = useState<string | null>(null);
  const theme = useTheme();
  const { signInWithGoogle, error: authError, isLoading } = useAuth();

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

  return (
    <View style={styles.container}>
      <Text variant="headlineMedium" style={styles.title}>Create Account</Text>
      
      <Text variant="bodyMedium" style={styles.subtitle}>
        Create an account quickly and easily using your Google account
      </Text>

      {error && (
        <Text variant="bodySmall" style={[styles.error, { color: theme.colors.error }]}>
          {error}
        </Text>
      )}

      <Button
        mode="contained"
        onPress={handleGoogleSignIn}
        loading={isLoading}
        style={styles.googleButton}
        disabled={isLoading}
        icon="google"
      >
        Sign up with Google
      </Button>

      <Button
        mode="text"
        onPress={() => navigation.navigate('Login')}
        style={styles.link}
        disabled={isLoading}
      >
        Already have an account? Sign in
      </Button>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    padding: 24,
  },
  title: {
    marginBottom: 16,
    textAlign: 'center',
  },
  subtitle: {
    textAlign: 'center',
    marginBottom: 32,
    opacity: 0.7,
  },
  googleButton: {
    marginTop: 16,
  },
  error: {
    marginBottom: 16,
    textAlign: 'center',
  },
  link: {
    marginTop: 15,
  },
});
