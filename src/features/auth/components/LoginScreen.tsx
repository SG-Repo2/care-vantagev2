import React, { useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { useTheme, TextInput, Button, Text } from 'react-native-paper';
import { StackNavigationProp } from '@react-navigation/stack';
import { AuthStackParamList } from '../../../navigation/types';
import { useAuth } from '../../../context/AuthContext';

type LoginScreenProps = {
  navigation: StackNavigationProp<AuthStackParamList, 'Login'>;
};

export const LoginScreen: React.FC<LoginScreenProps> = ({ navigation }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [localError, setLocalError] = useState<string | null>(null);
  const theme = useTheme();
  const { signInWithGoogle, error: authError, isLoading } = useAuth();

  const handleLogin = async () => {
    if (!email || !password) {
      setLocalError('Please enter both email and password');
      return;
    }
    setLocalError(null);
    // Email/password login not implemented in this version
    setLocalError('Email/password login is not available. Please use Google Sign-In.');
  };

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
      <Text variant="headlineMedium" style={styles.title}>Welcome Back</Text>

      <TextInput
        label="Email"
        value={email}
        onChangeText={(text) => {
          setEmail(text);
          setLocalError(null);
        }}
        mode="outlined"
        style={styles.input}
        autoCapitalize="none"
        keyboardType="email-address"
        disabled={isLoading}
      />
      
      <TextInput
        label="Password"
        value={password}
        onChangeText={(text) => {
          setPassword(text);
          setLocalError(null);
        }}
        mode="outlined"
        style={styles.input}
        secureTextEntry
        disabled={isLoading}
      />

      {error && (
        <Text variant="bodySmall" style={[styles.error, { color: theme.colors.error }]}>
          {error}
        </Text>
      )}

      <Button
        mode="contained"
        onPress={handleLogin}
        loading={isLoading}
        style={styles.button}
        disabled={isLoading || !email || !password}
      >
        Sign In
      </Button>

      <Button
        mode="outlined"
        onPress={handleGoogleSignIn}
        loading={isLoading}
        style={styles.googleButton}
        disabled={isLoading}
        icon="google"
      >
        Sign in with Google
      </Button>

      <Button
        mode="text"
        onPress={() => navigation.navigate('Register')}
        style={styles.link}
        disabled={isLoading}
      >
        Don't have an account? Register
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
    marginBottom: 32,
    textAlign: 'center',
  },
  input: {
    marginBottom: 16,
  },
  button: {
    marginTop: 16,
  },
  googleButton: {
    marginTop: 10,
  },
  error: {
    marginBottom: 16,
    textAlign: 'center',
  },
  link: {
    marginTop: 15,
  },
});
