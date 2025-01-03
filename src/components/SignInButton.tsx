import React from 'react';
import { TouchableOpacity, Text, View } from 'react-native';
import { useAuth } from '../context/AuthContext';

export function SignInButton() {
  const { signInWithGoogle, isLoading } = useAuth();

  return (
    <TouchableOpacity 
      onPress={signInWithGoogle}
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
