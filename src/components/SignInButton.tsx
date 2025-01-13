import React from 'react';
import { TouchableOpacity, Text, View } from 'react-native';
import { useAuth } from '../core/auth/contexts/AuthContext';

export function SignInButton() {
  const { signInWithGoogle, isLoading } = useAuth();

  const handleSignIn = async () => {
    try {
      await signInWithGoogle('');
    } catch (error) {
      console.error('Google sign in failed:', error);
    }
  };

  return (
    <TouchableOpacity 
      onPress={handleSignIn}
      disabled={isLoading}
      style={{
        backgroundColor: '#4285F4',
        padding: 16,
        borderRadius: 8,
      }}
    >
      <Text style={{ color: 'white', textAlign: 'center' }}>
        {isLoading ? 'Signing in...' : 'Sign in with Google'}
      </Text>
    </TouchableOpacity>
  );
}
