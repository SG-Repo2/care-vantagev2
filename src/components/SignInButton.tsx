import React from 'react';
import { TouchableOpacity, Text, Platform, View } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Google from 'expo-auth-session/providers/google';
import * as AuthSession from 'expo-auth-session';
import Constants from 'expo-constants';
import authService from '../services/authService';

export function SignInButton() {
  const [request, response, promptAsync] = Google.useIdTokenAuthRequest({
    clientId: Platform.select({
      ios: Constants.expoConfig?.extra?.googleAuth?.iosClientId,
      android: Constants.expoConfig?.extra?.googleAuth?.androidClientId,
      web: Constants.expoConfig?.extra?.googleAuth?.webClientId,
      default: Constants.expoConfig?.extra?.googleAuth?.expoClientId, // Used in Expo Go
    }),
    redirectUri: AuthSession.makeRedirectUri({
      scheme: 'carevantage',
      path: 'auth/callback'
    }),
  });

  const handleSignIn = async () => {
    try {
      const response = await promptAsync();
      if (response?.type === 'success') {
        const { id_token } = response.params;
        await authService.signInWithGoogle(id_token);
      }
    } catch (error) {
      console.error('Sign in error:', error);
    }
  };

  const clearStorage = async () => {
    try {
      await AsyncStorage.clear();
      console.log('Storage cleared successfully');
    } catch (error) {
      console.error('Error clearing storage:', error);
    }
  };

  return (
    <View>
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
      
      <TouchableOpacity 
        onPress={clearStorage}
        style={{
          backgroundColor: '#dc3545',
          padding: 16,
          borderRadius: 8,
          marginTop: 10,
        }}
      >
        <Text style={{ color: 'white', textAlign: 'center' }}>
          Clear Storage
        </Text>
      </TouchableOpacity>
    </View>
  );
}
