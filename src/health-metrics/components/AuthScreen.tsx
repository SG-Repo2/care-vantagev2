import React, { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { Text, ActivityIndicator, useTheme } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { FontAwesome } from '@expo/vector-icons';
import { useAuth } from '../../core/auth/contexts/AuthContext';
import { Button } from '../../components/common/atoms/Button';
import { spacing } from '../../components/common/theme/spacing';
import { supabase } from '../../utils/supabase';
import * as AuthSession from 'expo-auth-session';

const AuthScreen = () => {
  const [localError, setLocalError] = useState<string | null>(null);
  const { error: authError, isLoading } = useAuth();
  const theme = useTheme();

  const handleGoogleSignIn = async () => {
    try {
      setLocalError(null);
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: AuthSession.makeRedirectUri({
            path: 'callback'
          }),
          queryParams: {
            access_type: 'offline',
            prompt: 'consent',
          }
        }
      });
      
      if (error) throw error;
    } catch (err: unknown) {
      console.error('Sign-in error:', err);
      setLocalError(err instanceof Error ? err.message : 'Failed to sign in with Google');
    }
  };

  const error = localError || authError;

  const GoogleIcon = (
    <View style={{ marginRight: spacing.sm }}>
      <FontAwesome name="google" size={20} color="white" />
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <Text variant="headlineLarge" style={styles.title}>
          Health Metrics
        </Text>
        <Text variant="titleMedium" style={styles.subtitle}>
          Sign in to track your health journey
        </Text>
        
        {error && (
          <Text style={styles.errorText}>
            {error}
          </Text>
        )}

        {isLoading ? (
          <ActivityIndicator size="large" color="#23C552" style={styles.loader} />
        ) : (
          <Button
            variant="primary"
            size="large"
            onPress={handleGoogleSignIn}
            disabled={isLoading}
            icon={GoogleIcon}
            fullWidth
            style={styles.button}
          >
            Sign in with Google
          </Button>
        )}
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  title: {
    color: '#FFF',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    color: '#999',
    marginBottom: 48,
    textAlign: 'center',
  },
  button: {
    width: '80%',
    marginVertical: 12,
    backgroundColor: '#23C552',
  },
  errorText: {
    color: '#FF4B4B',
    marginBottom: 16,
    textAlign: 'center',
  },
  loader: {
    marginVertical: 12,
  },
});

export default AuthScreen; 