import React, { useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { useAuth } from '../context/AuthContext';
import { useTheme, TextInput, Button, Text } from 'react-native-paper';
import { StackNavigationProp } from '@react-navigation/stack';
import { AuthStackParamList } from '../../../navigation/types';

type LoginScreenProps = {
  navigation: StackNavigationProp<AuthStackParamList, 'Login'>;
};

export const LoginScreen: React.FC<LoginScreenProps> = ({ navigation }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const { login, signInWithGoogle, isLoading, error } = useAuth();
  const theme = useTheme();

  const handleLogin = async () => {
    try {
      await login(email, password);
    } catch (error) {
      // Error is handled by AuthContext
      console.error('Login error:', error);
    }
  };

  const handleGoogleSignIn = async () => {
    try {
      await signInWithGoogle();
    } catch (error) {
      // Error is handled by AuthContext
      console.error('Google Sign-In error:', error);
    }
  };

  return (
    <View style={styles.container}>
      <Text variant="headlineMedium" style={styles.title}>Welcome Back</Text>

      <TextInput
        label="Email"
        value={email}
        onChangeText={setEmail}
        mode="outlined"
        style={styles.input}
        autoCapitalize="none"
        keyboardType="email-address"
        disabled={isLoading}
      />
      
      <TextInput
        label="Password"
        value={password}
        onChangeText={setPassword}
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