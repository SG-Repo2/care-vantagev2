import React from 'react';
import { TouchableOpacity, Text } from 'react-native';
import authService from '../services/authService';
import { useUser } from '../context/UserContext';
import { StorageService } from '../services/storageService';

export function SignInButton() {
  const { setUser } = useUser();
  const { request, promptAsync } = authService.useGoogleAuth();

  const handleSignIn = async () => {
    try {
      const response = await promptAsync();
      
      if (response?.type === 'success' && response.authentication) {
        const { authentication } = response;
        const { accessToken } = authentication;
        
        await StorageService.setAuthToken(accessToken);
        const userInfo = await authService.getUserInfo(accessToken);
        setUser(userInfo);
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
