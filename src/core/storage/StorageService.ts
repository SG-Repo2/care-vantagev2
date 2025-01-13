import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEYS = {
  AUTH_TOKEN: 'auth_token',
  USER_DATA: 'user_data',
} as const;

export class StorageService {
  static async setAuthToken(token: string): Promise<void> {
    await AsyncStorage.setItem(STORAGE_KEYS.AUTH_TOKEN, token);
  }

  static async getAuthToken(): Promise<string | null> {
    return AsyncStorage.getItem(STORAGE_KEYS.AUTH_TOKEN);
  }

  static async removeAuthToken(): Promise<void> {
    await AsyncStorage.removeItem(STORAGE_KEYS.AUTH_TOKEN);
  }

  static async setUserData(userData: any): Promise<void> {
    await AsyncStorage.setItem(STORAGE_KEYS.USER_DATA, JSON.stringify(userData));
  }

  static async getUserData(): Promise<any | null> {
    const data = await AsyncStorage.getItem(STORAGE_KEYS.USER_DATA);
    return data ? JSON.parse(data) : null;
  }

  static async removeUserData(): Promise<void> {
    await AsyncStorage.removeItem(STORAGE_KEYS.USER_DATA);
  }

  static async clearAll(): Promise<void> {
    const keysToRemove = [
      STORAGE_KEYS.AUTH_TOKEN,
      STORAGE_KEYS.USER_DATA,
      '@health_permissions_granted',
      '@token_blacklist'
    ];
    
    try {
      await AsyncStorage.multiRemove(keysToRemove);
      console.log('Successfully cleared all storage data');
    } catch (error) {
      console.error('Error clearing storage:', error);
      throw error;
    }
  }

  static async clearAuthData(): Promise<void> {
    await this.clearAll(); // Reuse clearAll since we want to clear everything auth-related
  }
}
