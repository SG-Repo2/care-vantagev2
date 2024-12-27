import AsyncStorage from '@react-native-async-storage/async-storage';
import { StorageService } from './storageService';

export interface User {
  id: string;
  email: string;
  displayName: string;
  photoUrl?: string;
}

type AuthStateListener = (user: User | null) => void;

class AuthService {
  private static instance: AuthService;
  private currentUser: User | null = null;
  private listeners: Set<AuthStateListener> = new Set();

  private constructor() {
    // Initialize by loading user from storage
    this.loadInitialUser();
  }

  private async loadInitialUser() {
    try {
      const userData = await AsyncStorage.getItem('user');
      if (userData) {
        const user = JSON.parse(userData);
        this.currentUser = user;
        this.notifyListeners();
      }
    } catch (error) {
      console.error('Error loading initial user:', error);
    }
  }

  public static getInstance(): AuthService {
    if (!AuthService.instance) {
      AuthService.instance = new AuthService();
    }
    return AuthService.instance;
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

  public async setCurrentUser(user: User | null): Promise<void> {
    this.currentUser = user;
    if (user) {
      await Promise.all([
        AsyncStorage.setItem('user', JSON.stringify(user)),
        StorageService.setUserData(user)
      ]);
    } else {
      await Promise.all([
        AsyncStorage.removeItem('user'),
        StorageService.clearAll()
      ]);
    }
    this.notifyListeners();
  }

  public addAuthStateListener(listener: AuthStateListener): () => void {
    this.listeners.add(listener);
    // Return cleanup function
    return () => {
      this.listeners.delete(listener);
    };
  }

  private notifyListeners(): void {
    this.listeners.forEach(listener => listener(this.currentUser));
  }
}

export default AuthService.getInstance();
