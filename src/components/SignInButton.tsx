import React from 'react';
import { TouchableOpacity, Text } from 'react-native';
import authService from '../services/authService';

export function SignInButton() {
  const [request, _, promptAsync] = authService.useGoogleAuth();

  const handleSignIn = async () => {
    try {
      const response = await promptAsync();
      if (response?.type === 'success' && response.authentication) {
        await authService.signInWithGoogle(response.authentication.accessToken);
      }
    } catch (error) {
      console.error('Sign in error:', error);
    }
  };

  return (
    <TouchableOpacity 
      onPress={handleSignIn}
      disabled={!request}
      style={{
        backgroundColor: '#4285F4',
        padding: 16,
        borderRadius: 8,
      }}
    >
      <Text style={{ color: 'white', textAlign: 'center' }}>
        Sign in with Google
      </Text>
    </TouchableOpacity>
  );
}
