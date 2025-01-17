import React, { useState, useEffect } from 'react';
import { View, Platform } from 'react-native';
import { Button, Text, TextInput, useTheme, MD3Theme } from 'react-native-paper';
import { FontAwesome } from '@expo/vector-icons';
import { useAuth } from '../contexts/AuthContext';
import { StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Constants from 'expo-constants';
import * as WebBrowser from 'expo-web-browser';
import * as Google from 'expo-auth-session/providers/google';
import { makeRedirectUri } from 'expo-auth-session';

export const SignInScreen = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [localError, setLocalError] = useState<string | null>(null);
  const { signIn, signInWithGoogle, status, error: authError } = useAuth();
  const theme = useTheme();
  const isLoading = status === 'initializing';

  const googleAuth = Constants.expoConfig?.extra?.googleAuth;
  
  useEffect(() => {
    WebBrowser.warmUpAsync();
    return () => {
      WebBrowser.coolDownAsync();
    };
  }, []);

  const [request, response, promptAsync] = Google.useAuthRequest({
    clientId: googleAuth?.webClientId,
    responseType: "id_token",
    scopes: ['openid', 'profile', 'email'],
    extraParams: {
      access_type: 'offline',
      prompt: 'consent'
    },
    redirectUri: makeRedirectUri({
      scheme: 'care-vantage',
      path: 'google-auth'
    })
  });

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

  const handleGoogleSignIn = async () => {
    try {
      setLocalError(null);
      console.log('Starting Google sign-in...');
      
      if (!request) {
        throw new Error('Google auth request not initialized');
      }

      const result = await promptAsync();
      console.log('Google auth result:', result);
      
      if (result?.type === 'success') {
        if (!result.params?.id_token) {
          throw new Error('No ID token present in response');
        }
        console.log('Got ID token, signing in with Supabase...');
        await signInWithGoogle(result.params.id_token);
      } else if (result?.type === 'error') {
        throw new Error(result.error?.message || 'Google sign-in failed');
      } else if (result?.type === 'cancel') {
        console.log('User cancelled Google sign-in');
        return;
      }
    } catch (err) {
      console.error('Google sign-in error:', err);
      setLocalError(err instanceof Error ? err.message : 'Failed to sign in with Google');
    }
  };

  const error = localError || authError;
  const styles = createStyles(theme);

  const GoogleIcon = () => (
    <FontAwesome name="google" size={20} color="white" style={{ marginRight: 8 }} />
  );

  return (
    <SafeAreaView style={styles.container}>
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

        <Button
          mode="contained"
          onPress={handleLogin}
          loading={isLoading}
          disabled={isLoading || !email || !password || password.length < 6}
          style={[styles.button, styles.primaryButton]}
        >
          Sign In with Email
        </Button>

        <View style={styles.dividerContainer}>
          <View style={styles.dividerLine} />
          <Text style={styles.dividerText}>or continue with</Text>
          <View style={styles.dividerLine} />
        </View>

        <Button
          mode="contained"
          onPress={handleGoogleSignIn}
          loading={isLoading}
          disabled={isLoading}
          icon={GoogleIcon}
          style={[styles.button, styles.googleButton]}
        >
          Sign in with Google
        </Button>
      </View>
    </SafeAreaView>
  );
};

const createStyles = (theme: MD3Theme) => StyleSheet.create({
  container: {
    flex: 1,
    padding: 24,
    backgroundColor: theme.colors.background,
  },
  contentContainer: {
    flex: 1,
    justifyContent: 'center',
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
  },
}); 