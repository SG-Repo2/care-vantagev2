import { makeRedirectUri } from 'expo-auth-session';
import * as Google from 'expo-auth-session/providers/google';
import * as WebBrowser from 'expo-web-browser';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';

WebBrowser.maybeCompleteAuthSession();

export interface User {
  id: string;
  email: string;
  displayName: string;
  photoUrl?: string;
}

class AuthService {
  private static instance: AuthService;
  private googleConfig = Constants.expoConfig?.extra?.googleAuth;

  private constructor() {}

  public static getInstance(): AuthService {
    if (!AuthService.instance) {
      AuthService.instance = new AuthService();
    }
    return AuthService.instance;
  }

  public useGoogleAuth() {
    const [request, response, promptAsync] = Google.useAuthRequest({
      clientId: this.googleConfig?.webClientId,
      androidClientId: this.googleConfig?.androidClientId,
      iosClientId: this.googleConfig?.iosClientId,
      scopes: ['profile', 'email'],
    });

    return {
      request,
      response,
      promptAsync,
    };
  }

  public async getUserInfo(accessToken: string): Promise<User> {
    const response = await fetch('https://www.googleapis.com/userinfo/v2/me', {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    
    const userInfo = await response.json();
    
    return {
      id: userInfo.id,
      email: userInfo.email,
      displayName: userInfo.name,
      photoUrl: userInfo.picture,
    };
  }
}

export default AuthService.getInstance();
