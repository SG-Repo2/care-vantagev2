import { makeRedirectUri } from 'expo-auth-session';
import * as Google from 'expo-auth-session/providers/google';
import * as WebBrowser from 'expo-web-browser';
import Constants from 'expo-constants';
import { StorageService } from './storageService';

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
  private currentUser: User | null = null;

  private constructor() {}

  public static getInstance(): AuthService {
    if (!AuthService.instance) {
      AuthService.instance = new AuthService();
    }
    return AuthService.instance;
  }

  public useGoogleAuth() {
    return Google.useAuthRequest({
      clientId: this.googleConfig?.webClientId,
      androidClientId: this.googleConfig?.androidClientId,
      iosClientId: this.googleConfig?.iosClientId,
      scopes: ['profile', 'email'],
    });
  }

  public async login(email: string, password: string): Promise<User> {
    // Implement your login logic here
    const user = { id: '1', email, displayName: email }; // Replace with actual API call
    await this.setCurrentUser(user);
    return user;
  }

  public async register(email: string, password: string): Promise<User> {
    // Implement your registration logic here
    const user = { id: '1', email, displayName: email }; // Replace with actual API call
    await this.setCurrentUser(user);
    return user;
  }

  public async signInWithGoogle(accessToken: string): Promise<User> {
    const userInfo = await this.getUserInfo(accessToken);
    await this.setCurrentUser(userInfo);
    return userInfo;
  }

  public async logout(): Promise<void> {
    await StorageService.clearAll();
    this.currentUser = null;
  }

  public async getCurrentUser(): Promise<User | null> {
    if (this.currentUser) return this.currentUser;
    
    const userData = await StorageService.getUserData();
    if (userData) {
      this.currentUser = userData;
      return userData;
    }
    return null;
  }

  private async setCurrentUser(user: User): Promise<void> {
    this.currentUser = user;
    await StorageService.setUserData(user);
  }

  private async getUserInfo(accessToken: string): Promise<User> {
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
