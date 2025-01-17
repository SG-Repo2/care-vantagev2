import React, { useState, useEffect } from 'react';
import { View, Platform } from 'react-native';
import { TextInput, Text, useTheme, MD3Theme } from 'react-native-paper';
import { FontAwesome } from '@expo/vector-icons';
import Constants from 'expo-constants';
import * as WebBrowser from 'expo-web-browser';
import * as Google from 'expo-auth-session/providers/google';
import * as AuthSession from 'expo-auth-session';
import { useAuth } from '../contexts/AuthContext';
import { StyleSheet } from 'react-native';

export const SignInScreen = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [localError, setLocalError] = useState<string | null>(null);
  const { signIn, signInWithGoogle, status, error: authError } = useAuth();
  const theme = useTheme();
  const isLoading = status === 'initializing';

  const handleLogin = async () => {
    if (!email || !password) {
      setLocalError('Please enter both email and password');
      return;
    }
    if (password.length < 6) {
      setLocalError('Password must be at least 6 characters');
      return;
    }
    setLocalError(null);
    try {
      await signIn(email, password);
    } catch (err) {
      console.error('Login error:', err);
      setLocalError(err instanceof Error ? err.message : 'Failed to sign in');
    }
  };

  const googleAuth = Constants.expoConfig?.extra?.googleAuth;
  
  // Initialize AuthSession and WebBrowser for OAuth
  AuthSession.useAutoDiscovery('https://accounts.google.com');

  useEffect(() => {
    WebBrowser.maybeCompleteAuthSession();
    WebBrowser.warmUpAsync();
    return () => {
      WebBrowser.coolDownAsync();
    };
  }, []);

  const [request, response, promptAsync] = Google.useAuthRequest({
    androidClientId: googleAuth?.androidClientId,
    iosClientId: googleAuth?.iosClientId,
    clientId: googleAuth?.webClientId,
    responseType: "token",
    scopes: ['openid', 'profile', 'email']
  });

  const handleGoogleSignIn = async () => {
    try {
      setLocalError(null);
      const result = await promptAsync();
      
      if (result?.type === 'success') {
        if (!result.authentication?.accessToken) {
          throw new Error('No access token present in response');
        }
        await signInWithGoogle(result.authentication.accessToken);
      } else if (result?.type === 'error') {
        throw new Error(result.error?.message || 'Google sign-in failed');
      } else if (result?.type === 'cancel') {
        // User cancelled the login flow
        return;
      }
    } catch (err) {
      console.error('Google sign-in error:', err);
      setLocalError(err instanceof Error ? err.message : 'Failed to sign in with Google. Please try again.');
    }
  };

  const error = localError || authError;
  const styles = createStyles(theme);

  const GoogleIcon = (
    <View style={{ marginRight: 8 }}>
      <FontAwesome name="google" size={20} color="white" />
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.contentContainer}>
        <Text style={styles.title}>Health Metrics</Text>
        <Text style={styles.subtitle}>Sign in to track your health journey</Text>

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
          <Text style={styles.errorText}>{error}</Text>
        )}

        <TextInput.Button
          mode="contained"
          onPress={handleLogin}
          loading={isLoading}
          disabled={isLoading || !email || !password || password.length < 6}
          style={[styles.button, styles.primaryButton]}
        >
          Sign In with Email
        </TextInput.Button>

        <View style={styles.dividerContainer}>
          <View style={styles.dividerLine} />
          <Text style={styles.dividerText}>or continue with</Text>
          <View style={styles.dividerLine} />
        </View>

        <TextInput.Button
          mode="contained"
          onPress={handleGoogleSignIn}
          loading={isLoading}
          disabled={!request || isLoading}
          icon={() => GoogleIcon}
          style={[styles.button, styles.googleButton]}
        >
          Sign in with Google
        </TextInput.Button>
      </View>
    </View>
  );
};

const createStyles = (theme: MD3Theme) => StyleSheet.create({
  container: {
    flex: 1,
    padding: 24,
    backgroundColor: theme.colors.background,
    justifyContent: 'center',
  },
  contentContainer: {
    backgroundColor: theme.colors.surface,
    borderRadius: 24,
    padding: 24,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  title: {
    fontSize: 32,
    fontWeight: '700',
    marginBottom: 8,
    color: theme.colors.onBackground,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: theme.colors.onSurfaceVariant,
    marginBottom: 24,
    textAlign: 'center',
  },
  input: {
    marginBottom: 16,
    backgroundColor: 'transparent',
  },
  errorText: {
    fontSize: 14,
    color: theme.colors.error,
    marginBottom: 16,
    textAlign: 'center',
  },
  dividerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 20,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: theme.colors.outlineVariant,
  },
  dividerText: {
    marginHorizontal: 16,
    color: theme.colors.onSurfaceVariant,
    fontSize: 14,
  },
  button: {
    marginBottom: 16,
    borderRadius: 12,
  },
  primaryButton: {
    backgroundColor: theme.colors.primary,
  },
  googleButton: {
    backgroundColor: '#4285F4',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
}); 